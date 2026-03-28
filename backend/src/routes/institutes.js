import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const institutesRouter = Router();

// Public: approved institutes list (with district, city for filtering)
institutesRouter.get('/', async (req, res) => {
  try {
    const institutes = await prisma.institute.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ district: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        district: true,
        city: true,
        collegeNo: true,
        udiseNo: true,
        address: true,
        contactPerson: true,
        contactEmail: true,
        contactMobile: true,
        status: true
      }
    });
    return res.json({ institutes });
  } catch (err) {
    console.error('Error fetching institutes:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Public: institute admin user registration for existing institute
institutesRouter.post('/register', async (req, res) => {
  const body = z
    .object({
      instituteId: z.coerce.number().int().positive(),
      username: z.string().min(3),
      password: z.string().min(8),
      address: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactMobile: z.string().min(8).optional(),
      consentLetter: z.string().optional(),
      letterOfConsent: z.string().optional()
    })
    .parse(req.body);

  const institute = await prisma.institute.findUnique({ where: { id: body.instituteId } });
  if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

  const existingInstituteAdmin = await prisma.user.findFirst({
    where: { instituteId: institute.id, role: { name: 'INSTITUTE' } }
  });
  if (existingInstituteAdmin) return res.status(409).json({ error: 'INSTITUTE_ADMIN_ALREADY_EXISTS' });

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (!instituteRole) return res.status(500).json({ error: 'ROLE_MISSING' });

  const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUser) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const user = await prisma.user.create({
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

  await prisma.institute.update({
    where: { id: institute.id },
    data: {
      address: body.address ?? institute.address,
      contactPerson: body.contactPerson ?? institute.contactPerson,
      contactEmail: body.contactEmail ?? institute.contactEmail,
      contactMobile: body.contactMobile ?? institute.contactMobile
    }
  });

  return res.json({ ok: true, user: { id: user.id, username: user.username, instituteId: user.instituteId } });
});

// Super admin: invite institute admin user
institutesRouter.post('/users/invite', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const body = z.object({ 
    instituteId: z.number().int().positive(),
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    mobile: z.string().min(8).optional()
  }).parse(req.body);

  const institute = await prisma.institute.findUnique({ where: { id: body.instituteId } });
  if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (!instituteRole) return res.status(500).json({ error: 'ROLE_MISSING' });

  if (body.username) {
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) return res.status(409).json({ error: 'USERNAME_TAKEN' });
  }

  const user = await prisma.user.create({
    data: {
      username: body.username ?? `inst-${Date.now()}`,
      passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
      roleId: instituteRole.id,
      instituteId: institute.id,
      status: 'PENDING',
      email: body.email,
      mobile: body.mobile
    }
  });

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15);
  await prisma.instituteInvite.create({ data: { instituteId: institute.id, userId: user.id, token, expiresAt } });

  return res.json({ ok: true, activationLink: `/institute/activate?token=${token}` });
});

// Super admin: create institute user directly
institutesRouter.post('/users/create', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const body = z
    .object({
      instituteId: z.number().int().positive(),
      username: z.string().min(3),
      password: z.string().min(8),
      email: z.string().email().optional(),
      mobile: z.string().min(8).optional()
    })
    .parse(req.body);

  const institute = await prisma.institute.findUnique({ where: { id: body.instituteId } });
  if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (!instituteRole) return res.status(500).json({ error: 'ROLE_MISSING' });

  const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUser) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const existingInstituteUser = await prisma.user.findFirst({
    where: { instituteId: institute.id, role: { name: 'INSTITUTE' } }
  });

  let user;
  if (existingInstituteUser) {
    if (existingInstituteUser.status === 'ACTIVE') {
      return res.status(409).json({
        error: 'INSTITUTE_ADMIN_ALREADY_EXISTS',
        message: 'Institute admin already exists for this institute',
        existingUser: {
          id: existingInstituteUser.id,
          username: existingInstituteUser.username,
          status: existingInstituteUser.status
        }
      });
    }

    const updateData = {
      passwordHash: await bcrypt.hash(body.password, 10),
      status: 'ACTIVE',
      email: body.email,
      mobile: body.mobile
    };
    if (existingInstituteUser.username !== body.username) {
      const dupUser = await prisma.user.findUnique({ where: { username: body.username } });
      if (dupUser) return res.status(409).json({ error: 'USERNAME_TAKEN' });
      updateData.username = body.username;
    }
    user = await prisma.user.update({ where: { id: existingInstituteUser.id }, data: updateData });
  } else {
    user = await prisma.user.create({
      data: {
        username: body.username,
        passwordHash: await bcrypt.hash(body.password, 10),
        roleId: instituteRole.id,
        instituteId: institute.id,
        status: 'ACTIVE',
        email: body.email,
        mobile: body.mobile
      }
    });
  }

  await prisma.institute.update({ where: { id: institute.id }, data: { status: 'APPROVED' } });

  return res.json({ ok: true, user: { id: user.id, username: user.username, status: user.status } });
});

// Public: validate invite token
institutesRouter.get('/users/invite/:token', async (req, res) => {
  const token = z.string().min(10).parse(req.params.token);
  const invite = await prisma.instituteInvite.findUnique({ where: { token }, include: { institute: true, user: true } });
  if (!invite || invite.expiresAt < new Date() || invite.usedAt) return res.status(404).json({ error: 'INVITE_INVALID' });

  return res.json({
    institute: {
      id: invite.institute.id,
      name: invite.institute.name,
      code: invite.institute.code,
      collegeNo: invite.institute.collegeNo,
      udiseNo: invite.institute.udiseNo,
      status: invite.institute.status
    },
    username: invite.user?.username
  });
});

// Public: complete user activation from invite
institutesRouter.post('/users/invite/:token/complete', async (req, res) => {
  const token = z.string().min(10).parse(req.params.token);
  const body = z.object({ 
    username: z.string().min(3),
    password: z.string().min(8),
    email: z.string().email().optional(),
    mobile: z.string().min(8).optional()
  }).parse(req.body);

  const invite = await prisma.instituteInvite.findUnique({ where: { token }, include: { institute: true, user: true } });
  if (!invite || invite.expiresAt < new Date() || invite.usedAt) return res.status(404).json({ error: 'INVITE_INVALID' });
  if (!invite.user) return res.status(404).json({ error: 'INVITE_USER_NOT_FOUND' });

  const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUsername && existingUsername.id !== invite.user.id) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const updated = await prisma.user.update({ 
    where: { id: invite.user.id }, 
    data: { username: body.username, passwordHash, status: 'PENDING', email: body.email, mobile: body.mobile } 
  });
  await prisma.instituteInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

  return res.json({ ok: true, user: { id: updated.id, username: updated.username, status: updated.status } });
});

// Public: approved institutes list
institutesRouter.get('/list', async (req, res) => {
  const institutes = await prisma.institute.findMany({
    where: { status: 'APPROVED' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      collegeNo: true,
      udiseNo: true,
      address: true,
      contactPerson: true,
      contactEmail: true,
      contactMobile: true,
      status: true
    }
  });
  return res.json({ institutes });
});

// Super admin: list institute users waiting approval
institutesRouter.get('/users', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { name: 'INSTITUTE' }, status: 'PENDING' },
    include: { institute: true }
  });
  return res.json({ users });
});

// Super admin: approve institute admin
institutesRouter.patch('/users/:id/approve', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { institute: true, role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });

  const updatedUser = await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  if (user.institute) {
    await prisma.institute.update({ where: { id: user.institute.id }, data: { status: 'APPROVED' } });
  }
  return res.json({ user: updatedUser, institute: user.institute });
});

// Super admin: list all institute users
institutesRouter.get('/users/all', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const q = z.object({ 
    status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']).optional(),
    search: z.string().optional()
  }).parse(req.query);
  const where = { role: { name: 'INSTITUTE' } };
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [
      { username: { contains: q.search } },
      { email: { contains: q.search } },
      { mobile: { contains: q.search } },
      { institute: { name: { contains: q.search } } }
    ];
  }
  const users = await prisma.user.findMany({ 
    where,
    include: { institute: true },
    orderBy: { createdAt: 'desc' },
    take: 500 
  });
  return res.json({ users });
});

// Super admin: get single institute user
institutesRouter.get('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { institute: true, role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  return res.json({ user });
});

// Super admin: update institute user
institutesRouter.patch('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({
      username: z.string().min(3).optional(),
      password: z.string().min(8).optional(),
      email: z.string().email().optional(),
      mobile: z.string().min(8).optional(),
      status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']).optional()
    })
    .parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  const data = {};
  if (body.username && body.username !== user.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUsername) return res.status(409).json({ error: 'USERNAME_TAKEN' });
    data.username = body.username;
  }
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.email) data.email = body.email;
  if (body.mobile) data.mobile = body.mobile;
  if (body.status) data.status = body.status;
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'NO_CHANGES' });

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return res.json({ user: updated });
});

// Super admin: change institute user status
institutesRouter.patch('/users/:id/status', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z.object({ status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: body.status } });
  return res.json({ user: updated });
});
