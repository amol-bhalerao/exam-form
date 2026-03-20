import { Router } from 'express';
import bcrypt from 'bcryptjs';
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
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            institute: user.institute ? { id: user.institute.id, name: user.institute.name, status: user.institute.status } : null
        }
    });
});
meRouter.put('/', requireAuth, async (req, res) => {
    const userId = req.auth.userId;
    const body = req.body;
    const { username, password, email, mobile } = body;
    const data = {};
    if (username) {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing && existing.id !== userId)
            return res.status(409).json({ error: 'USERNAME_TAKEN' });
        data.username = username;
    }
    if (password) {
        data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (email)
        data.email = email;
    if (mobile)
        data.mobile = mobile;
    if (Object.keys(data).length === 0)
        return res.status(400).json({ error: 'NO_CHANGES' });
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return res.json({ user: { id: updated.id, username: updated.username, email: updated.email, mobile: updated.mobile, status: updated.status } });
});
