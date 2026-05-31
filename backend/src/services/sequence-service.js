import { prisma } from '../prisma.js';

const PAD_INSTITUTE = 4;
const PAD_BOARD = 6;

const STUDENT_STREAM_CODE_LOOKUP = {
  '1': 'Science',
  '2': 'Arts',
  '3': 'Commerce',
  '4': 'Vocational',
  '5': 'Technology'
};

function pad(num, width) {
  return String(num).padStart(width, '0');
}

function sanitizeCode(value, fallback, maxLen = 20) {
  const raw = String(value || fallback || 'UNK')
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, '')
    .slice(0, maxLen);
  return raw || 'UNK';
}

export function resolveStreamIdFromStudentCode(streamCode, streams = [], fallbackStreamId = null) {
  if (streamCode === undefined || streamCode === null || streamCode === '') return fallbackStreamId;

  const normalized = String(streamCode).trim().toLowerCase();
  const requested = String(STUDENT_STREAM_CODE_LOOKUP[normalized] || normalized).toLowerCase();
  const matched = streams.find((stream) => {
    const name = String(stream?.name || '').toLowerCase();
    return name === requested || name.includes(requested) || requested.includes(name);
  });

  return matched?.id ?? fallbackStreamId;
}

async function resolveContext(client, applicationId) {
  const app = await client.examApplication.findUnique({
    where: { id: applicationId },
    include: {
      institute: true,
      exam: { include: { stream: true } },
      student: true
    }
  });
  if (!app) throw new Error('APPLICATION_NOT_FOUND');

  const streams = await client.stream.findMany({ orderBy: { name: 'asc' } });
  const streamId = resolveStreamIdFromStudentCode(
    app.student?.streamCode,
    streams,
    app.exam?.streamId ?? null
  );

  let stream = streamId ? streams.find((s) => s.id === streamId) : app.exam?.stream;
  if (!stream && app.exam?.stream) stream = app.exam.stream;

  let streamShort = stream?.shortCode;
  if (!streamShort && stream?.name) {
    const name = String(stream.name).toUpperCase();
    if (name.includes('SCIENCE')) streamShort = 'SCI';
    else if (name.includes('ART')) streamShort = 'ART';
    else if (name.includes('COMMERCE')) streamShort = 'COM';
    else if (name.includes('VOC')) streamShort = 'VOC';
    else streamShort = sanitizeCode(stream.name, 'GEN', 3);
  }
  if (!streamShort) streamShort = 'ALL';

  let examCode = app.exam?.examCode;
  if (!examCode) {
    examCode = `EXM${pad(app.examId, 3)}`;
    await client.exam.update({
      where: { id: app.examId },
      data: { examCode }
    });
  }

  const instituteCode = sanitizeCode(
    app.institute?.code || app.institute?.collegeNo,
    `INST${pad(app.instituteId, 3)}`,
    12
  );

  return { app, streamId, streamShort, examCode, instituteCode };
}

async function bumpSequence(client, { level, examId, streamId, instituteId }) {
  const where = {
    level,
    examId,
    streamId: streamId ?? null,
    instituteId: instituteId ?? null
  };

  const existing = await client.examFormSequence.findFirst({ where });

  if (existing) {
    const next = existing.currentSequence + 1;
    await client.examFormSequence.update({
      where: { id: existing.id },
      data: {
        currentSequence: next,
        totalApplications: { increment: 1 }
      }
    });
    return next;
  }

  const row = await client.examFormSequence.create({
    data: {
      level,
      examId,
      streamId: streamId ?? null,
      instituteId: instituteId ?? null,
      currentSequence: 1,
      totalApplications: 1
    }
  });
  return row.currentSequence;
}

function buildInstituteSequence(instituteCode, streamShort, examCode, seq) {
  return `${instituteCode}-${streamShort}-${examCode}-${pad(seq, PAD_INSTITUTE)}`;
}

function buildBoardSequence(streamShort, examCode, seq) {
  return `${streamShort}-${examCode}-${pad(seq, PAD_BOARD)}`;
}

async function uniqueInstituteNumber(client, base, examId, streamId, instituteId, startSeq) {
  let seq = startSeq;
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = buildInstituteSequence(
      base.instituteCode,
      base.streamShort,
      base.examCode,
      seq
    );
    const clash = await client.examApplication.findFirst({
      where: { instituteSequenceNumber: candidate }
    });
    if (!clash) return { number: candidate, seq };
    seq = await bumpSequence(client, {
      level: 'INSTITUTE',
      examId,
      streamId,
      instituteId
    });
  }
  throw new Error('UNABLE_TO_ALLOCATE_INSTITUTE_SEQUENCE');
}

async function uniqueBoardNumber(client, base, examId, streamId, startSeq) {
  let seq = startSeq;
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = buildBoardSequence(base.streamShort, base.examCode, seq);
    const clash = await client.examApplication.findFirst({
      where: { boardSequenceNumber: candidate }
    });
    if (!clash) return { number: candidate, seq };
    seq = await bumpSequence(client, {
      level: 'BOARD',
      examId,
      streamId,
      instituteId: null
    });
  }
  throw new Error('UNABLE_TO_ALLOCATE_BOARD_SEQUENCE');
}

/**
 * Assign institute + board sequence numbers (idempotent if already set).
 */
export async function assignSequenceNumbers(applicationId, existingClient = null) {
  const run = async (client) => {
    const ctx = await resolveContext(client, applicationId);
    const { app, streamId, streamShort, examCode, instituteCode } = ctx;

    const updateData = {};

    if (!app.instituteSequenceNumber) {
      const start = await bumpSequence(client, {
        level: 'INSTITUTE',
        examId: app.examId,
        streamId,
        instituteId: app.instituteId
      });
      const { number } = await uniqueInstituteNumber(
        client,
        { instituteCode, streamShort, examCode },
        app.examId,
        streamId,
        app.instituteId,
        start
      );
      updateData.instituteSequenceNumber = number;
      updateData.applSrNo = number;
    }

    if (!app.boardSequenceNumber) {
      const start = await bumpSequence(client, {
        level: 'BOARD',
        examId: app.examId,
        streamId,
        instituteId: null
      });
      const { number } = await uniqueBoardNumber(
        client,
        { streamShort, examCode },
        app.examId,
        streamId,
        start
      );
      updateData.boardSequenceNumber = number;
    }

    if (!Object.keys(updateData).length) {
      return client.examApplication.findUnique({ where: { id: applicationId } });
    }

    return client.examApplication.update({
      where: { id: applicationId },
      data: updateData
    });
  };

  if (existingClient?.examApplication) {
    return run(existingClient);
  }
  return prisma.$transaction(run);
}

/** Backfill all verified applications missing sequences */
export async function backfillAllMissingSequences() {
  const apps = await prisma.examApplication.findMany({
    where: {
      status: { in: ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED'] },
      OR: [{ instituteSequenceNumber: null }, { boardSequenceNumber: null }]
    },
    select: { id: true },
    orderBy: { id: 'asc' }
  });

  let updated = 0;
  for (const { id } of apps) {
    await assignSequenceNumbers(id);
    updated++;
  }
  return { total: apps.length, updated };
}
