import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const mastersRouter = Router();

// PUBLIC: Get all streams (no auth required)
mastersRouter.get('/streams', async (req, res) => {
  try {
    const query = z.object({ search: z.string().optional() }).parse(req.query);
    const where = query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {};
    const streams = await prisma.stream.findMany({ where, orderBy: { name: 'asc' } });
    return res.json({ streams, count: streams.length });
  } catch (err) {
    console.error('Error fetching streams:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
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

// PUBLIC: Get all subjects for form display (no auth required)
mastersRouter.get('/subjects', async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
    return res.json({ subjects, categories: subjectCategories, count: subjects.length });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PUBLIC: Get all boards (no auth required)
mastersRouter.get('/boards', async (req, res) => {
  try {
    // TODO: Implement boards table in schema
    // For now, return static list of Maharashtra boards
    const boards = [
      { id: 1, code: 'MSBSHSE', name: 'Maharashtra State Board of Secondary and Higher Secondary Education' },
      { id: 2, code: 'CBSE', name: 'Central Board of Secondary Education' },
      { id: 3, code: 'ICSE', name: 'Indian Certificate of Secondary Education' }
    ];
    return res.json({ boards, count: boards.length });
  } catch (err) {
    console.error('Error fetching boards:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PUBLIC: Get all districts (no auth required)
mastersRouter.get('/districts', async (req, res) => {
  try {
    // TODO: Implement districts table in schema
    // For now, return static list of Maharashtra districts
    const districts = [
      { id: 1, name: 'Ahmednagar', state: 'Maharashtra' },
      { id: 2, name: 'Akola', state: 'Maharashtra' },
      { id: 3, name: 'Amravati', state: 'Maharashtra' },
      { id: 4, name: 'Aurangabad', state: 'Maharashtra' },
      { id: 5, name: 'Beed', state: 'Maharashtra' },
      { id: 6, name: 'Bhandara', state: 'Maharashtra' },
      { id: 7, name: 'Buldhana', state: 'Maharashtra' },
      { id: 8, name: 'Chandrapur', state: 'Maharashtra' },
      { id: 9, name: 'Dhule', state: 'Maharashtra' },
      { id: 10, name: 'Gadchiroli', state: 'Maharashtra' },
      { id: 11, name: 'Gadag', state: 'Maharashtra' },
      { id: 12, name: 'Gondia', state: 'Maharashtra' },
      { id: 13, name: 'Hingoli', state: 'Maharashtra' },
      { id: 14, name: 'Jalgaon', state: 'Maharashtra' },
      { id: 15, name: 'Jalna', state: 'Maharashtra' },
      { id: 16, name: 'Kolhapur', state: 'Maharashtra' },
      { id: 17, name: 'Latur', state: 'Maharashtra' },
      { id: 18, name: 'Mumbai City', state: 'Maharashtra' },
      { id: 19, name: 'Mumbai Suburban', state: 'Maharashtra' },
      { id: 20, name: 'Nagpur', state: 'Maharashtra' },
      { id: 21, name: 'Nanded', state: 'Maharashtra' },
      { id: 22, name: 'Nandurbar', state: 'Maharashtra' },
      { id: 23, name: 'Nashik', state: 'Maharashtra' },
      { id: 24, name: 'Parbhani', state: 'Maharashtra' },
      { id: 25, name: 'Pune', state: 'Maharashtra' },
      { id: 26, name: 'Raigad', state: 'Maharashtra' },
      { id: 27, name: 'Ratnagiri', state: 'Maharashtra' },
      { id: 28, name: 'Sangli', state: 'Maharashtra' },
      { id: 29, name: 'Satara', state: 'Maharashtra' },
      { id: 30, name: 'Sindhudurg', state: 'Maharashtra' },
      { id: 31, name: 'Solapur', state: 'Maharashtra' },
      { id: 32, name: 'Thane', state: 'Maharashtra' },
      { id: 33, name: 'Wardha', state: 'Maharashtra' },
      { id: 34, name: 'Washim', state: 'Maharashtra' },
      { id: 35, name: 'Yavatmal', state: 'Maharashtra' }
    ];
    return res.json({ districts, count: districts.length });
  } catch (err) {
    console.error('Error fetching districts:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
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
