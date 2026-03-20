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

  const where: any = {};
  if (q.search) {
    where.OR = [{ name: { contains: q.search } }, { academicYear: { contains: q.search } }, { session: { contains: q.search } }];
  }
  if (q.streamId) where.streamId = q.streamId;

  // Hide passed exam windows by default for non-admin users
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

  return res.json({ exams, metadata: { page, limit, total } });
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
      createdByUserId: req.auth!.userId
    }
  });

  return res.json({ exam });
});

