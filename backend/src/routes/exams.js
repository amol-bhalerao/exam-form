import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

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
  if (req.auth?.role === 'INSTITUTE') {
    instituteId = req.auth.instituteId ?? null;
  } else if (req.auth?.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    instituteId = student?.instituteId ?? null;
  }

  let examsWithCapacity = exams;
  if (instituteId && exams.length > 0) {
    const examIds = exams.map((exam) => exam.id);
    const [capacityRows, usageRows] = await Promise.all([
      prisma.instituteExamCapacity.findMany({
        where: { instituteId, examId: { in: examIds } }
      }),
      prisma.examApplication.groupBy({
        by: ['examId'],
        where: { instituteId, examId: { in: examIds } },
        _count: { _all: true }
      })
    ]);

    const capacityMap = new Map(capacityRows.map((row) => [row.examId, row.totalStudents]));
    const usageMap = new Map(usageRows.map((row) => [row.examId, row._count._all]));

    examsWithCapacity = exams.map((exam) => {
      const totalStudents = capacityMap.has(exam.id) ? capacityMap.get(exam.id) : null;
      const applicationsUsed = usageMap.get(exam.id) ?? 0;
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
