import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const newsRouter = Router();
// In-memory storage for news items (replace with database table later)
let newsItems = [
    {
        id: 1,
        title: 'HSC Examination 2024 Schedule Released',
        content: 'The Higher Secondary Certificate examination schedule for 2024 has been released. Students are advised to check the official website for detailed information.',
        type: 'news',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Important Notice: Document Verification',
        content: 'All students must complete document verification process before the application deadline. Incomplete applications will not be accepted.',
        type: 'notification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Board Meeting - January 15, 2024',
        content: 'Board meeting scheduled for January 15, 2024, to discuss examination policies and procedures.',
        type: 'event',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
// Get all news items (for admin)
newsRouter.get('/', requireAuth, requireRole(['BOARD']), (req, res) => {
    res.json({ news: newsItems });
});
// Get public news items (for landing page)
newsRouter.get('/public', (req, res) => {
    // Return only active news items, limit to recent ones
    const publicNews = newsItems
        .filter(item => item.type !== 'internal') // Exclude internal notifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10); // Limit to 10 most recent
    res.json({ news: publicNews });
});
// Create news item
newsRouter.post('/', requireAuth, requireRole(['BOARD']), (req, res) => {
    const body = z
        .object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(['news', 'event', 'notification'])
    })
        .parse(req.body);
    const newItem = {
        id: Math.max(...newsItems.map(item => item.id), 0) + 1,
        title: body.title,
        content: body.content,
        type: body.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    newsItems.push(newItem);
    res.status(201).json(newItem);
});
// Update news item
newsRouter.put('/:id', requireAuth, requireRole(['BOARD']), (req, res) => {
    const id = parseInt(req.params.id?.toString() || '');
    const body = z
        .object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(['news', 'event', 'notification'])
    })
        .parse(req.body);
    const index = newsItems.findIndex(item => item.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'News item not found' });
    }
    newsItems[index] = {
        ...newsItems[index],
        title: body.title,
        content: body.content,
        type: body.type,
        updatedAt: new Date().toISOString()
    };
    res.json(newsItems[index]);
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
