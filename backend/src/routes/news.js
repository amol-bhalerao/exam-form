import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const newsRouter = Router();

// Get all news items (for board admin)
newsRouter.get('/', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      include: {
        createdBy: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get public news items (for landing page)
newsRouter.get('/public', async (req, res) => {
  try {
    const publicNews = await prisma.news.findMany({
      where: {
        isActive: true,
        type: { not: 'internal' }
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        createdBy: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json({ news: publicNews });
  } catch (error) {
    console.error('Error fetching public news:', error);
    res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
});

// Create news item
newsRouter.post('/', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        type: z.enum(['news', 'event', 'notification']),
        isActive: z.boolean().optional()
      })
      .parse(req.body);

    const news = await prisma.news.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        isActive: body.isActive ?? true,
        createdByUserId: req.auth.userId
      },
      include: {
        createdBy: { select: { id: true, username: true } }
      }
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// Update news item
newsRouter.put('/:id', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const newsId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        type: z.enum(['news', 'event', 'notification']).optional(),
        isActive: z.boolean().optional()
      })
      .parse(req.body);

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) {
      return res.status(404).json({ error: 'News item not found' });
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: {
        title: body.title ?? news.title,
        content: body.content ?? news.content,
        type: body.type ?? news.type,
        isActive: body.isActive ?? news.isActive
      },
      include: {
        createdBy: { select: { id: true, username: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// Delete news item
newsRouter.delete('/:id', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const newsId = z.coerce.number().int().positive().parse(req.params.id);
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) {
      return res.status(404).json({ error: 'News item not found' });
    }
    await prisma.news.delete({ where: { id: newsId } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// Delete news item
newsRouter.delete('/:id', requireAuth, requireRole(['BOARD']), (req, res) => {
  const id = parseInt(req.params.id?.toString() || '');
  const index = newsItems.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'News item not found' });
  }

  newsItems.splice(index, 1);
  res.json({ message: 'News item deleted successfully' });
});
