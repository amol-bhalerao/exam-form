import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const mastersRouter = Router();

mastersRouter.get('/streams', requireAuth, async (req, res) => {
  const query = z.object({ search: z.string().optional() }).parse(req.query);
  const where = query.search ? { name: { contains: query.search } } : {};
  const streams = await prisma.stream.findMany({ where, orderBy: { name: 'asc' } });
  return res.json({ streams });
});

mastersRouter.post('/streams', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const body = z.object({ name: z.string().min(2) }).parse(req.body);
  const existing = await prisma.stream.findFirst({ where: { name: body.name } });
  if (existing) return res.status(409).json({ error: 'STREAM_EXISTS' });
  const stream = await prisma.stream.create({ data: { name: body.name } });
  return res.json({ stream });
});

mastersRouter.put('/streams/:id', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const streamId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z.object({ name: z.string().min(2) }).parse(req.body);
  const stream = await prisma.stream.findUnique({ where: { id: streamId } });
  if (!stream) return res.status(404).json({ error: 'NOT_FOUND' });
  const duplicate = await prisma.stream.findFirst({ where: { name: body.name, NOT: { id: streamId } } });
  if (duplicate) return res.status(409).json({ error: 'STREAM_EXISTS' });
  const updated = await prisma.stream.update({ where: { id: streamId }, data: { name: body.name } });
  return res.json({ stream: updated });
});

mastersRouter.delete('/streams/:id', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const streamId = z.coerce.number().int().positive().parse(req.params.id);
  const stream = await prisma.stream.findUnique({ where: { id: streamId } });
  if (!stream) return res.status(404).json({ error: 'NOT_FOUND' });
  const boundSubject = await prisma.streamSubject.findFirst({ where: { streamId } });
  if (boundSubject) return res.status(400).json({ error: 'STREAM_HAS_SUBJECTS' });
  await prisma.stream.delete({ where: { id: streamId } });
  return res.json({ ok: true });
});

const subjectCategories = ['language', 'Compulsory', 'Optional Subjects', 'Bifocal Subjects', 'Vocational Subjects'];

mastersRouter.get('/subjects', requireAuth, async (_req, res) => {
  const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
  return res.json({ subjects, categories: subjectCategories });
});

mastersRouter.post('/subjects', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      code: z.string().min(1).regex(/^[A-Z0-9]+$/, 'Subject code must contain only capital letters and numbers, no spaces'),
      category: z.enum(subjectCategories)
    })
    .parse(req.body);

  // Enforce uppercase
  const subjectCode = body.code.toUpperCase();

  // Check if code already exists
  const existing = await prisma.subject.findFirst({
    where: { code: subjectCode }
  });
  if (existing) {
    return res.status(409).json({ error: 'CODE_EXISTS', message: 'Subject code already exists' });
  }

  const subject = await prisma.subject.create({ data: { name: body.name, code: subjectCode, category: body.category } });
  return res.json({ subject });
});

mastersRouter.put('/subjects/:id', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const subjectId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({
      name: z.string().min(2).optional(),
      code: z.string().min(1).regex(/^[A-Z0-9]+$/, 'Subject code must contain only capital letters and numbers, no spaces').optional(),
      category: z.enum(subjectCategories).optional()
    })
    .parse(req.body);

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return res.status(404).json({ error: 'NOT_FOUND' });

  const updateData = {
    name: body.name ?? subject.name,
    code: body.code ? body.code.toUpperCase() : subject.code,
    category: body.category ?? subject.category
  };

  // Check if new code already exists (and it's different from current code)
  if (body.code && updateData.code !== subject.code) {
    const existing = await prisma.subject.findFirst({
      where: { code: updateData.code, NOT: { id: subjectId } }
    });
    if (existing) {
      return res.status(409).json({ error: 'CODE_EXISTS', message: 'Subject code already exists' });
    }
  }

  const updated = await prisma.subject.update({
    where: { id: subjectId },
    data: updateData
  });

  return res.json({ subject: updated });
});

mastersRouter.delete('/subjects/:id', requireAuth, requireRole(['SUPER_ADMIN', 'BOARD']), async (req, res) => {
  const subjectId = z.coerce.number().int().positive().parse(req.params.id);
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return res.status(404).json({ error: 'NOT_FOUND' });
  await prisma.subject.delete({ where: { id: subjectId } });
  return res.json({ ok: true });
});
