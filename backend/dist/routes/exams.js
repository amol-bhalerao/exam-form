import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const examsRouter = Router();
examsRouter.get('/', requireAuth, async (_req, res) => {
    const exams = await prisma.exam.findMany({
        include: { stream: true },
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    return res.json({ exams });
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
