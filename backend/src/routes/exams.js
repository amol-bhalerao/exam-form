import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

const STUDENT_STREAM_CODE_LOOKUP = {
  '1': 'Science',
  '2': 'Arts',
  '3': 'Commerce',
  '4': 'Vocational',
  '5': 'Technology'
};

function resolveStreamIdFromStudentCode(streamCode, streams = [], fallbackStreamId = null) {
  if (streamCode === undefined || streamCode === null || streamCode === '') return fallbackStreamId;

  const normalized = String(streamCode).trim().toLowerCase();
  const requested = String(STUDENT_STREAM_CODE_LOOKUP[normalized] || normalized).toLowerCase();
  const matched = streams.find((stream) => {
    const name = String(stream?.name || '').toLowerCase();
    return name === requested || name.includes(requested) || requested.includes(name);
  });

  return matched?.id ?? fallbackStreamId;
}

export const examsRouter = Router();

examsRouter.get('/', requireAuth, async (req, res) => {
  const q = z
    .object({
      search: z.string().optional(),
      streamId: z.coerce.number().int().positive().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional()
    })
    .parse(req.query);

  const where = {};
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { academicYear: { contains: q.search } },
      { session: { contains: q.search } }
    ];
  }
  if (q.streamId) where.streamId = q.streamId;

  // Hide passed exam windows for non-admin users
  if (req.auth?.role === 'STUDENT' || req.auth?.role === 'INSTITUTE') {
    const now = new Date();
    where.applicationOpen = { lte: now };
    where.applicationClose = { gte: now };
  }

  const page = q.page ?? 1;
  const limit = q.limit ?? 25;
  const total = await prisma.exam.count({ where });
  const exams = await prisma.exam.findMany({
    where,
    include: { stream: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });

  let instituteId = null;
  let studentStreamId = null;
  if (req.auth?.role === 'INSTITUTE') {
    instituteId = req.auth.instituteId ?? null;
  } else if (req.auth?.role === 'STUDENT') {
    const [student, streams] = await Promise.all([
      prisma.student.findUnique({ where: { userId: req.auth.userId } }),
      prisma.stream.findMany({ orderBy: { name: 'asc' } })
    ]);
    instituteId = student?.instituteId ?? null;
    studentStreamId = resolveStreamIdFromStudentCode(student?.streamCode, streams, null);
  }

  let examsWithCapacity = exams;
  if (instituteId && exams.length > 0) {
    const examIds = exams.map((exam) => exam.id);
    const [capacityRows, applications, streams] = await Promise.all([
      prisma.instituteExamCapacity.findMany({
        where: { instituteId, examId: { in: examIds } }
      }),
      prisma.examApplication.findMany({
        where: { instituteId, examId: { in: examIds } },
        select: {
          examId: true,
          student: {
            select: { streamCode: true }
          }
        }
      }),
      prisma.stream.findMany({ orderBy: { name: 'asc' } })
    ]);

    const capacityMap = new Map(capacityRows.map((row) => [`${row.examId}:${row.streamId}`, row.totalStudents]));
    const usageMap = new Map();

    for (const app of applications) {
      const exam = exams.find((item) => item.id === app.examId);
      const streamId = resolveStreamIdFromStudentCode(app.student?.streamCode, streams, exam?.streamId ?? null);
      if (!streamId) continue;
      const key = `${app.examId}:${streamId}`;
      usageMap.set(key, (usageMap.get(key) ?? 0) + 1);
    }

    examsWithCapacity = exams.map((exam) => {
      if (req.auth?.role === 'STUDENT') {
        const targetStreamId = studentStreamId ?? exam.streamId;
        const key = `${exam.id}:${targetStreamId}`;
        const totalStudents = capacityMap.has(key) ? capacityMap.get(key) : null;
        const applicationsUsed = usageMap.get(key) ?? 0;
        const remainingApplications = totalStudents === null ? null : Math.max(totalStudents - applicationsUsed, 0);
        return {
          ...exam,
          totalStudents,
          applicationsUsed,
          remainingApplications,
          isCapacityReached: totalStudents === null ? false : applicationsUsed >= totalStudents
        };
      }

      const examCapacityRows = capacityRows.filter((row) => row.examId === exam.id);
      const totalStudents = examCapacityRows.length
        ? examCapacityRows.reduce((sum, row) => sum + (row.totalStudents ?? 0), 0)
        : null;
      const applicationsUsed = Array.from(usageMap.entries())
        .filter(([key]) => key.startsWith(`${exam.id}:`))
        .reduce((sum, [, count]) => sum + count, 0);
      const remainingApplications = totalStudents === null ? null : Math.max(totalStudents - applicationsUsed, 0);
      return {
        ...exam,
        totalStudents,
        applicationsUsed,
        remainingApplications,
        isCapacityReached: totalStudents === null ? false : applicationsUsed >= totalStudents
      };
    });
  }

  return res.json({ exams: examsWithCapacity, metadata: { page, limit, total } });
});

examsRouter.post('/', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      academicYear: z.string().min(4),
      session: z.string().min(3),
      streamId: z.number().int().positive(),
      applicationOpen: z.string().datetime(),
      applicationClose: z.string().datetime(),
      lateFeeClose: z.string().datetime().optional(),
      instructions: z.string().optional()
    })
    .parse(req.body);

  const exam = await prisma.exam.create({
    data: {
      name: body.name,
      academicYear: body.academicYear,
      session: body.session,
      streamId: body.streamId,
      applicationOpen: new Date(body.applicationOpen),
      applicationClose: new Date(body.applicationClose),
      lateFeeClose: body.lateFeeClose ? new Date(body.lateFeeClose) : null,
      instructions: body.instructions,
      createdByUserId: req.auth.userId
    }
  });

  return res.json({ exam });
});
