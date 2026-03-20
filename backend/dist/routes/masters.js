import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const mastersRouter = Router();
mastersRouter.get('/streams', requireAuth, async (_req, res) => {
    const streams = await prisma.stream.findMany({ orderBy: { name: 'asc' } });
    return res.json({ streams });
});
mastersRouter.post('/streams', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
    const body = z.object({ name: z.string().min(2) }).parse(req.body);
    const stream = await prisma.stream.create({ data: { name: body.name } });
    return res.json({ stream });
});
mastersRouter.get('/subjects', requireAuth, async (_req, res) => {
    const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
    return res.json({ subjects });
});
mastersRouter.post('/subjects', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
    const body = z.object({ name: z.string().min(2), code: z.string().min(1) }).parse(req.body);
    const subject = await prisma.subject.create({ data: { name: body.name, code: body.code } });
    return res.json({ subject });
});
