import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const usersRouter = Router();
// Get all users (for super admin)
usersRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const query = z.object({ search: z.string().optional() }).parse(req.query);
    const where = query.search ? {
        OR: [
            { username: { contains: query.search } },
            { email: { contains: query.search } },
            { role: { name: { contains: query.search } } }
        ]
    } : {};
    const users = await prisma.user.findMany({
        where,
        include: {
            role: true,
            institute: { select: { name: true, code: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return res.json({ users });
});
// Create a new user (board user)
usersRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const body = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        roleName: z.enum(['BOARD', 'SUPER_ADMIN'])
    }).parse(req.body);
    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing)
        return res.status(409).json({ error: 'USERNAME_EXISTS' });
    // Get the role
    const role = await prisma.role.findUnique({ where: { name: body.roleName } });
    if (!role)
        return res.status(400).json({ error: 'INVALID_ROLE' });
    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
        data: {
            username: body.username,
            passwordHash,
            email: body.email,
            mobile: body.mobile,
            roleId: role.id,
            status: 'ACTIVE'
        },
        include: { role: true }
    });
    return res.json({ user });
});
// Update user
usersRouter.put('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({
        username: z.string().min(3).optional(),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']).optional(),
        roleName: z.enum(['BOARD', 'SUPER_ADMIN']).optional()
    }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
    // Check username uniqueness if changing
    if (body.username && body.username !== user.username) {
        const existing = await prisma.user.findUnique({ where: { username: body.username } });
        if (existing)
            return res.status(409).json({ error: 'USERNAME_EXISTS' });
    }
    let roleId = user.roleId;
    if (body.roleName) {
        const role = await prisma.role.findUnique({ where: { name: body.roleName } });
        if (!role)
            return res.status(400).json({ error: 'INVALID_ROLE' });
        roleId = role.id;
    }
    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            username: body.username ?? user.username,
            email: body.email ?? user.email,
            mobile: body.mobile ?? user.mobile,
            status: body.status ?? user.status,
            roleId
        },
        include: { role: true, institute: { select: { name: true, code: true } } }
    });
    return res.json({ user: updated });
});
// Reset user password
usersRouter.post('/:id/reset-password', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({ newPassword: z.string().min(6) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    });
    return res.json({ ok: true });
});
// Delete user
usersRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
    // Don't allow deleting super admin users
    if (user.roleId === 1)
        return res.status(400).json({ error: 'CANNOT_DELETE_SUPER_ADMIN' });
    await prisma.user.delete({ where: { id: userId } });
    return res.json({ ok: true });
});
