import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const institutesRouter = Router();
// Public: institute self-registration (creates institute + institute admin user as PENDING)
institutesRouter.post('/register', async (req, res) => {
    const body = z
        .object({
        instituteName: z.string().min(2),
        instituteCode: z.string().min(2).optional(),
        address: z.string().min(2).optional(),
        contactPerson: z.string().min(2),
        contactEmail: z.string().email().optional(),
        contactMobile: z.string().min(8).optional(),
        username: z.string().min(3),
        password: z.string().min(8)
    })
        .parse(req.body);
    const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
    if (!instituteRole)
        return res.status(500).json({ error: 'ROLE_MISSING' });
    const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUser)
        return res.status(409).json({ error: 'USERNAME_TAKEN' });
    const result = await prisma.$transaction(async (tx) => {
        const institute = await tx.institute.create({
            data: {
                name: body.instituteName,
                code: body.instituteCode,
                address: body.address,
                contactPerson: body.contactPerson,
                contactEmail: body.contactEmail,
                contactMobile: body.contactMobile,
                status: 'PENDING'
            }
        });
        const user = await tx.user.create({
            data: {
                username: body.username,
                passwordHash: await bcrypt.hash(body.password, 10),
                roleId: instituteRole.id,
                instituteId: institute.id,
                status: 'PENDING',
                email: body.contactEmail,
                mobile: body.contactMobile
            }
        });
        return { institute, user };
    });
    return res.json({
        ok: true,
        instituteId: result.institute.id,
        userId: result.user.id,
        status: { institute: result.institute.status, user: result.user.status }
    });
});
// Super admin: list institutes
institutesRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const q = z
        .object({
        status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'DISABLED']).optional(),
        search: z.string().optional()
    })
        .parse(req.query);
    const institutes = await prisma.institute.findMany({
        where: {
            status: q.status,
            ...(q.search
                ? {
                    OR: [
                        { name: { contains: q.search } },
                        { code: { contains: q.search } },
                        { contactPerson: { contains: q.search } }
                    ]
                }
                : {})
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });
    return res.json({ institutes });
});
// Super admin: approve institute (activates institute + its institute users)
institutesRouter.post('/:id/approve', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
    const instituteId = z.coerce.number().int().positive().parse(req.params.id);
    const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
    if (!institute)
        return res.status(404).json({ error: 'NOT_FOUND' });
    await prisma.$transaction(async (tx) => {
        await tx.institute.update({ where: { id: instituteId }, data: { status: 'APPROVED' } });
        const instituteRole = await tx.role.findUnique({ where: { name: 'INSTITUTE' } });
        if (!instituteRole)
            throw new Error('ROLE_MISSING');
        await tx.user.updateMany({
            where: { instituteId, roleId: instituteRole.id },
            data: { status: 'ACTIVE' }
        });
    });
    return res.json({ ok: true });
});
