import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
export const meRouter = Router();
meRouter.get('/', requireAuth, async (req, res) => {
    const userId = req.auth.userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, institute: true }
    });
    if (!user)
        return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({
        user: {
            userId: user.id,
            username: user.username,
            role: user.role.name,
            instituteId: user.instituteId,
            institute: user.institute ? { id: user.institute.id, name: user.institute.name, status: user.institute.status } : null
        }
    });
});
