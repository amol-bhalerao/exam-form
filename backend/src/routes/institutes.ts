import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const institutesRouter = Router();

// Public: institute admin user registration for existing institute (created by super admin in DB)
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

// Super admin: invite institute admin user and generate activation token
institutesRouter.post('/users/invite', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const body = z.object({ instituteId: z.number().int().positive(), username: z.string().min(3).optional(), email: z.string().email().optional(), mobile: z.string().min(8).optional() }).parse(req.body);

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

  // For now return link directly.
  return res.json({ ok: true, activationLink: `/institute/activate?token=${token}` });
});

// Super admin: create institute user directly (active)
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

    const updateData: any = {
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

// Public: validate invite token and institute details
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

// Public: complete user activation from invite link
institutesRouter.post('/users/invite/:token/complete', async (req, res) => {
  const token = z.string().min(10).parse(req.params.token);
  const body = z.object({ username: z.string().min(3), password: z.string().min(8), email: z.string().email().optional(), mobile: z.string().min(8).optional() }).parse(req.body);

  const invite = await prisma.instituteInvite.findUnique({ where: { token }, include: { institute: true, user: true } });
  if (!invite || invite.expiresAt < new Date() || invite.usedAt) return res.status(404).json({ error: 'INVITE_INVALID' });
  if (!invite.user) return res.status(404).json({ error: 'INVITE_USER_NOT_FOUND' });

  const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUsername && existingUsername.id !== invite.user.id) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const updated = await prisma.user.update({ where: { id: invite.user.id }, data: { username: body.username, passwordHash, status: 'PENDING', email: body.email, mobile: body.mobile } });
  await prisma.instituteInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

  return res.json({ ok: true, user: { id: updated.id, username: updated.username, status: updated.status } });
});

// Public: approved institutes list for registration selection
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

// Super admin: approve institute admin user. This also activates institute.
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
  const q = z.object({ status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']).optional(), search: z.string().optional() }).parse(req.query);
  const where: any = { role: { name: 'INSTITUTE' } };
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [{ username: { contains: q.search } }, { email: { contains: q.search } }, { mobile: { contains: q.search } }, { institute: { name: { contains: q.search } } }];
  }
  const users = await prisma.user.findMany({ where, include: { institute: true }, orderBy: { createdAt: 'desc' }, take: 500 });
  return res.json({ users });
});

// Super admin: get single institute user
institutesRouter.get('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { institute: true, role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  return res.json({ user });
});

// Super admin: update institute user details
institutesRouter.patch('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({ username: z.string().min(3).optional(), password: z.string().min(8).optional(), email: z.string().email().optional(), mobile: z.string().min(8).optional(), status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']).optional() })
    .parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  const data: any = {};
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

// Super admin: delete institute user
institutesRouter.delete('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const userId = z.coerce.number().int().positive().parse(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
  await prisma.user.delete({ where: { id: userId } });
  return res.json({ ok: true });
});

// Board: create institute (pending only)
institutesRouter.post('/board/create', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const body = z
    .object({
      instituteName: z.string().min(2),
      instituteCode: z.string().min(2).optional(),
      address: z.string().min(2).optional(),
      collegeNo: z.string().min(1).optional(),
      udiseNo: z.string().min(1).optional(),
      contactPerson: z.string().min(2),
      contactEmail: z.string().email().optional(),
      contactMobile: z.string().min(8).optional(),
      username: z.string().min(3),
      password: z.string().min(8)
    })
    .parse(req.body);

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (!instituteRole) return res.status(500).json({ error: 'ROLE_MISSING' });

  const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUser) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const result = await prisma.$transaction(async (tx) => {
    const institute = await tx.institute.create({
      data: {
        name: body.instituteName,
        code: body.instituteCode,
        address: body.address,
        collegeNo: body.collegeNo ?? 'UNKNOWN',
        udiseNo: body.udiseNo ?? 'UNKNOWN',
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

// Super admin: create institute (can set status)
institutesRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      code: z.string().min(2).optional(),
      address: z.string().min(2).optional(),
      collegeNo: z.string().min(1).optional(),
      udiseNo: z.string().min(1).optional(),
      contactPerson: z.string().min(2),
      contactEmail: z.string().email().optional(),
      contactMobile: z.string().min(8).optional(),
      username: z.string().min(3),
      password: z.string().min(8),
      status: z.enum(['APPROVED', 'PENDING']).optional()
    })
    .parse(req.body);

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (!instituteRole) return res.status(500).json({ error: 'ROLE_MISSING' });

  const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUser) return res.status(409).json({ error: 'USERNAME_TAKEN' });

  const result = await prisma.$transaction(async (tx) => {
    const institute = await tx.institute.create({
      data: {
        name: body.name,
        code: body.code,
        address: body.address,
        collegeNo: body.collegeNo ?? 'UNKNOWN',
        udiseNo: body.udiseNo ?? 'UNKNOWN',
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        contactMobile: body.contactMobile,
        status: body.status ?? 'APPROVED'
      }
    });

    const user = await tx.user.create({
      data: {
        username: body.username,
        passwordHash: await bcrypt.hash(body.password, 10),
        roleId: instituteRole.id,
        instituteId: institute.id,
        status: body.status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
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

// Super admin: update institute status (and institute admin user login status)
institutesRouter.patch('/:id/status', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z.object({ status: z.enum(['APPROVED', 'PENDING', 'DISABLED']) }).parse(req.body);

  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  const updatedInstitute = await prisma.institute.update({ where: { id: instituteId }, data: { status: body.status } });

  const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
  if (instituteRole) {
    await prisma.user.updateMany({
      where: { instituteId, roleId: instituteRole.id },
      data: { status: body.status === 'APPROVED' ? 'ACTIVE' : 'PENDING' }
    });
  }

  return res.json({ institute: updatedInstitute });
});

// Board: block or stop receiving application forms for an institute
institutesRouter.patch('/:id/block', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.institute.update({ where: { id: instituteId }, data: { status: 'DISABLED' } });
  return res.json({ institute: updated });
});

// Board: unblock institute (keeps pending for super admin activation)
institutesRouter.patch('/:id/unblock', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.institute.update({ where: { id: instituteId }, data: { status: 'PENDING' } });
  return res.json({ institute: updated });
});

// Board: toggle intake for application forms from institute
institutesRouter.patch('/:id/toggle-accepting', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z.object({ acceptingApplications: z.boolean() }).parse(req.body);

  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.institute.update({ where: { id: instituteId }, data: { acceptingApplications: body.acceptingApplications } });
  return res.json({ institute: updated });
});

// Board: teachers dashboard and filters
institutesRouter.get('/board/teachers', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const q = z
    .object({
      instituteId: z.coerce.number().int().positive().optional(),
      institute: z.string().optional(),
      active: z.enum(['true', 'false']).optional(),
      governmentId: z.string().optional(),
      certificate: z.string().optional(),
      subject: z.string().optional(),
      teacherType: z.string().optional(),
      casteCategory: z.string().optional(),
      serviceStartDateFrom: z.string().optional(),
      serviceStartDateTo: z.string().optional(),
      leavingDateFrom: z.string().optional(),
      leavingDateTo: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional()
    })
    .parse(req.query);

  const where: any = {};
  if (q.instituteId) where.instituteId = q.instituteId;
  if (q.active) where.active = q.active === 'true';
  if (q.governmentId) where.governmentId = { contains: q.governmentId };
  if (q.teacherType) where.teacherType = q.teacherType;
  if (q.certificate) where.certifications = { contains: q.certificate };
  if (q.subject) where.subjectSpecialization = { contains: q.subject };
  if (q.teacherType) where.teacherType = q.teacherType;
  if (q.casteCategory) where.casterCategory = q.casteCategory;
  if (q.serviceStartDateFrom || q.serviceStartDateTo) {
    where.serviceStartDate = {} as any;
    if (q.serviceStartDateFrom) where.serviceStartDate.gte = new Date(q.serviceStartDateFrom);
    if (q.serviceStartDateTo) where.serviceStartDate.lte = new Date(q.serviceStartDateTo);
  }
  if (q.leavingDateFrom || q.leavingDateTo) {
    where.leavingDate = {} as any;
    if (q.leavingDateFrom) where.leavingDate.gte = new Date(q.leavingDateFrom);
    if (q.leavingDateTo) where.leavingDate.lte = new Date(q.leavingDateTo);
  }
  if (q.search || q.institute) {
    where.AND = [];
    if (q.search) {
      where.AND.push({
        OR: [
          { fullName: { contains: q.search } },
          { designation: { contains: q.search } },
          { subjectSpecialization: { contains: q.search } },
          { qualification: { contains: q.search } }
        ]
      });
    }
    if (q.institute) {
      where.AND.push({ institute: { name: { contains: q.institute } } });
    }
  }

  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const teachers = await prisma.teacher.findMany({
    where,
    include: { institute: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });
  const total = await prisma.teacher.count({ where });

  const activeCount = await prisma.teacher.count({ where: { ...where, active: true } });
  const inactiveCount = await prisma.teacher.count({ where: { ...where, active: false } });

  return res.json({ teachers, metadata: { page, limit, total, activeCount, inactiveCount } });
});

// Board: fetch teacher history by Aadhar/governmentId
institutesRouter.get('/board/teachers/history', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const q = z.object({ governmentId: z.string().min(10).max(20) }).parse(req.query);
  const teachers = await prisma.teacher.findMany({
    where: { governmentId: q.governmentId },
    include: { institute: true },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ teachers });
});

institutesRouter.put('/board/teachers/:id', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const teacherId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z.object({
    fullName: z.string().min(2).optional(),
    designation: z.string().optional(),
    subjectSpecialization: z.string().optional(),
    active: z.boolean().optional(),
    governmentId: z.string().optional(),
    email: z.string().email().optional(),
    mobile: z.string().optional()
  }).parse(req.body);

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.teacher.update({ where: { id: teacherId }, data: body });
  return res.json({ teacher: updated });
});

institutesRouter.delete('/board/teachers/:id', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const teacherId = z.coerce.number().int().positive().parse(req.params.id);
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return res.status(404).json({ error: 'NOT_FOUND' });
  await prisma.teacher.delete({ where: { id: teacherId } });
  return res.json({ ok: true });
});

// Institute: get my institute
institutesRouter.get('/me', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    include: {
      teachers: true,
      instituteStreamSubjects: { include: { stream: true, subject: true } }
    }
  });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  return res.json({ institute });
});

// Institute: update own institute details (restrict fixed fields)
institutesRouter.put('/me', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const body = z
    .object({
      address: z.string().min(2).optional(),
      district: z.string().optional(),
      taluka: z.string().optional(),
      city: z.string().optional(),
      pincode: z.string().optional(),
      contactPerson: z.string().min(2).optional(),
      contactEmail: z.string().email().optional(),
      contactMobile: z.string().min(8).optional(),
      acceptingApplications: z.boolean().optional(),
      examApplicationLimit: z.number().int().min(1).optional()
    })
    .parse(req.body);

  const updated = await prisma.institute.update({
    where: { id: instituteId },
    data: {
      address: body.address,
      district: body.district,
      taluka: body.taluka,
      city: body.city,
      pincode: body.pincode,
      contactPerson: body.contactPerson,
      contactEmail: body.contactEmail,
      contactMobile: body.contactMobile,
      acceptingApplications: body.acceptingApplications ?? undefined,
      examApplicationLimit: body.examApplicationLimit ?? undefined
    }
  });

  return res.json({ institute: updated });
});

// Institute: add teacher
institutesRouter.post('/me/teachers', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const body = z
    .object({
      fullName: z.string().min(2),
      dob: z.string().optional(),
      gender: z.string().optional(),
      nationality: z.string().optional(),
      governmentId: z.string().min(10).max(20).optional(),
      casterCategory: z.string().optional(),
      qualification: z.string().optional(),
      subjectSpecialization: z.string().optional(),
      certifications: z.string().optional(),
      certificates: z.string().optional(),
      designation: z.string().optional(),
      serviceStartDate: z.string().optional(),
      appointmentDate: z.string().optional(),
      leavingDate: z.string().optional(),
      leavingNote: z.string().optional(),
      teacherType: z.string().optional(),
      employeeId: z.string().optional(),
      payScale: z.string().optional(),
      salary: z.number().optional(),
      previousExperience: z.string().optional(),
      totalYearsService: z.number().optional(),
      promotionsTransfers: z.string().optional(),
      trainingPrograms: z.string().optional(),
      workshops: z.string().optional(),
      ictCertification: z.string().optional(),
      appendixIxPublished: z.boolean().optional(),
      disclosureNotes: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().min(8).optional()
    })
    .parse(req.body);

  const toDate = (value?: string) => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  const existingTeacher = await prisma.teacher.findFirst({
    where: {
      instituteId,
      OR: [
        { governmentId: body.governmentId },
        { fullName: body.fullName },
        ...(body.email ? [{ email: body.email }] : []),
        ...(body.mobile ? [{ mobile: body.mobile }] : [])
      ]
    }
  });
  if (existingTeacher) return res.status(409).json({ error: 'DUPLICATE_TEACHER' });

  const teacher = await prisma.teacher.create({
    data: {
      instituteId,
      fullName: body.fullName,
      dob: toDate(body.dob),
      gender: body.gender,
      nationality: body.nationality,
      governmentId: body.governmentId,
      casterCategory: body.casterCategory,
      qualification: body.qualification,
      subjectSpecialization: body.subjectSpecialization,
      certifications: body.certifications,
      certificates: body.certificates,
      designation: body.designation,
      serviceStartDate: toDate(body.serviceStartDate),
      appointmentDate: toDate(body.appointmentDate),
      leavingDate: toDate(body.leavingDate),
      leavingNote: body.leavingNote,
      teacherType: body.teacherType,
      employeeId: body.employeeId,
      payScale: body.payScale,
      salary: body.salary,
      previousExperience: body.previousExperience,
      totalYearsService: body.totalYearsService,
      promotionsTransfers: body.promotionsTransfers,
      trainingPrograms: body.trainingPrograms,
      workshops: body.workshops,
      ictCertification: body.ictCertification,
      appendixIxPublished: body.appendixIxPublished ?? false,
      disclosureNotes: body.disclosureNotes,
      email: body.email,
      mobile: body.mobile
    }
  });

  return res.json({ teacher });
});

// Public: search institutes by name/code for student application selection
institutesRouter.get('/search', requireAuth, async (req, res) => {
  const q = z.object({ query: z.string().min(1).optional(), status: z.enum(['APPROVED','PENDING','REJECTED','DISABLED']).optional() }).parse(req.query);
  const where: any = {};
  if (q.status) where.status = q.status;
  if (q.query) {
    where.OR = [
      { name: { contains: q.query } },
      { code: { contains: q.query } },
      { contactPerson: { contains: q.query } },
      { city: { contains: q.query } },
      { district: { contains: q.query } },
      { taluka: { contains: q.query } },
      { collegeNo: { contains: q.query } },
      { udiseNo: { contains: q.query } }
    ];
  }
  const institutes = await prisma.institute.findMany({ where, orderBy: { name: 'asc' }, take: 60 });
  return res.json({ institutes });
});

// Institute: list teachers with optional filters
institutesRouter.get('/me/teachers', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const q = z
    .object({
      search: z.string().optional(),
      teacherType: z.string().optional(),
      certificate: z.string().optional(),
      subject: z.string().optional(),
      casteCategory: z.string().optional(),
      serviceStartDateFrom: z.string().optional(),
      serviceStartDateTo: z.string().optional(),
      leavingDateFrom: z.string().optional(),
      leavingDateTo: z.string().optional(),
      active: z.enum(['true', 'false']).optional(),
      governmentId: z.string().optional()
    })
    .parse(req.query);

  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const where: any = { instituteId };
  if (q.teacherType) where.teacherType = q.teacherType;
  if (q.certificate) where.certifications = { contains: q.certificate };
  if (q.subject) where.subjectSpecialization = { contains: q.subject };
  if (q.casteCategory) where.casterCategory = q.casteCategory;
  if (q.serviceStartDateFrom || q.serviceStartDateTo) {
    where.serviceStartDate = {} as any;
    if (q.serviceStartDateFrom) where.serviceStartDate.gte = new Date(q.serviceStartDateFrom);
    if (q.serviceStartDateTo) where.serviceStartDate.lte = new Date(q.serviceStartDateTo);
  }
  if (q.leavingDateFrom || q.leavingDateTo) {
    where.leavingDate = {} as any;
    if (q.leavingDateFrom) where.leavingDate.gte = new Date(q.leavingDateFrom);
    if (q.leavingDateTo) where.leavingDate.lte = new Date(q.leavingDateTo);
  }
  if (q.active) where.active = q.active === 'true';
  if (q.governmentId) where.governmentId = { contains: q.governmentId };
  if (q.search) {
    where.AND = [
      {
        OR: [
          { fullName: { contains: q.search } },
          { subjectSpecialization: { contains: q.search } },
          { designation: { contains: q.search } },
          { qualification: { contains: q.search } }
        ]
      }
    ];
  }

  const teachers = await prisma.teacher.findMany({ where, orderBy: { createdAt: 'desc' } });
  return res.json({ teachers });
});

// Institute: update teacher details
institutesRouter.put('/me/teachers/:id', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  const teacherId = z.coerce.number().int().positive().parse(req.params.id);
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const body = z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    governmentId: z.string().min(10).max(20).optional(),
    casterCategory: z.string().optional(),
    qualification: z.string().optional(),
    subjectSpecialization: z.string().optional(),
    certifications: z.string().optional(),
    certificates: z.string().optional(),
    designation: z.string().optional(),
    serviceStartDate: z.string().optional(),
    appointmentDate: z.string().optional(),
    leavingDate: z.string().optional(),
    leavingNote: z.string().optional(),
    teacherType: z.string().optional(),
    employeeId: z.string().optional(),
    payScale: z.string().optional(),
    salary: z.number().optional(),
    previousExperience: z.string().optional(),
    totalYearsService: z.number().optional(),
    promotionsTransfers: z.string().optional(),
    trainingPrograms: z.string().optional(),
    workshops: z.string().optional(),
    ictCertification: z.string().optional(),
    appendixIxPublished: z.boolean().optional(),
    disclosureNotes: z.string().optional(),
    email: z.string().email().optional(),
    mobile: z.string().min(8).optional(),
    active: z.boolean().optional()
  }).parse(req.body);

  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, instituteId } });
  if (!teacher) return res.status(404).json({ error: 'NOT_FOUND' });

  const toDate = (value?: string) => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  if (body.fullName || body.email || body.mobile || body.governmentId) {
    const duplicate = await prisma.teacher.findFirst({
      where: {
        instituteId,
        NOT: { id: teacherId },
        OR: [
          ...(body.governmentId ? [{ governmentId: body.governmentId }] : []),
          ...(body.fullName ? [{ fullName: body.fullName }] : []),
          ...(body.email ? [{ email: body.email }] : []),
          ...(body.mobile ? [{ mobile: body.mobile }] : [])
        ]
      }
    });
    if (duplicate) return res.status(409).json({ error: 'DUPLICATE_TEACHER' });
  }

  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      fullName: body.fullName,
      dob: toDate(body.dob),
      gender: body.gender,
      nationality: body.nationality,
      governmentId: body.governmentId,
      casterCategory: body.casterCategory,
      qualification: body.qualification,
      subjectSpecialization: body.subjectSpecialization,
      certifications: body.certifications,
      certificates: body.certificates,
      designation: body.designation,
      serviceStartDate: toDate(body.serviceStartDate),
      appointmentDate: toDate(body.appointmentDate),
      leavingDate: toDate(body.leavingDate),
      leavingNote: body.leavingNote,
      teacherType: body.teacherType,
      employeeId: body.employeeId,
      payScale: body.payScale,
      salary: body.salary,
      previousExperience: body.previousExperience,
      totalYearsService: body.totalYearsService,
      promotionsTransfers: body.promotionsTransfers,
      trainingPrograms: body.trainingPrograms,
      workshops: body.workshops,
      ictCertification: body.ictCertification,
      appendixIxPublished: body.appendixIxPublished,
      disclosureNotes: body.disclosureNotes,
      email: body.email,
      mobile: body.mobile,
      active: body.active
    }
  });

  return res.json({ teacher: updated });
});

// Institute: fetch teacher history by Aadhar/governmentId
institutesRouter.get('/me/teachers/history', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const q = z.object({ governmentId: z.string().min(10).max(20) }).parse(req.query);
  const teachers = await prisma.teacher.findMany({
    where: { governmentId: q.governmentId },
    include: { institute: true },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ teachers });
});

// Institute: set teacher active/inactive
institutesRouter.patch('/me/teachers/:id/status', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  const teacherId = z.coerce.number().int().positive().parse(req.params.id);
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const body = z.object({ active: z.boolean() }).parse(req.body);
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, instituteId } });
  if (!teacher) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.teacher.update({ where: { id: teacherId }, data: { active: body.active } });
  return res.json({ teacher: updated });
});

// Institute: set stream subjects mapping
institutesRouter.post('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const body = z
    .object({
      streamId: z.number().int().positive(),
      subjectIds: z.array(z.number().int().positive()).min(1)
    })
    .parse(req.body);

  await prisma.$transaction(async (tx) => {
    await tx.instituteStreamSubject.deleteMany({ where: { instituteId, streamId: body.streamId } });
    await tx.instituteStreamSubject.createMany({
      data: body.subjectIds.map((subjectId) => ({ instituteId, streamId: body.streamId, subjectId }))
    });
  });

  const settings = await prisma.instituteStreamSubject.findMany({
    where: { instituteId, streamId: body.streamId },
    include: { subject: true, stream: true }
  });
  return res.json({ settings });
});

// Institute: list assigned stream subjects
institutesRouter.get('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const instituteId = req.auth!.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const settings = await prisma.instituteStreamSubject.findMany({
    where: { instituteId },
    include: { stream: true, subject: true }
  });
  return res.json({ settings });
});

// Super admin: get institute details
institutesRouter.get('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    include: { teachers: true }
  });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });
  return res.json({ institute });
});

// Super admin: update institute details (including fixed details)
institutesRouter.put('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({
      name: z.string().min(2).optional(),
      code: z.string().min(1).optional(),
      collegeNo: z.string().min(1).optional(),
      udiseNo: z.string().min(1).optional(),
      address: z.string().optional(),
      district: z.string().optional(),
      taluka: z.string().optional(),
      city: z.string().optional(),
      pincode: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactMobile: z.string().optional(),
      status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'DISABLED']).optional(),
      acceptingApplications: z.boolean().optional()
    })
    .parse(req.body);

  const updated = await prisma.institute.update({
    where: { id: instituteId },
    data: {
      name: body.name,
      code: body.code,
      collegeNo: body.collegeNo,
      udiseNo: body.udiseNo,
      address: body.address,
      district: body.district,
      taluka: body.taluka,
      city: body.city,
      pincode: body.pincode,
      contactPerson: body.contactPerson,
      contactEmail: body.contactEmail,
      contactMobile: body.contactMobile,
      status: body.status,
      acceptingApplications: body.acceptingApplications
    }
  });

  return res.json({ institute: updated });
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

// Board: list institutes
institutesRouter.get('/board/list', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const q = z.object({ status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'DISABLED']).optional(), search: z.string().optional(), page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional() }).parse(req.query);
  const page = q.page ?? 1;
  const limit = q.limit ?? 30;

  const where: any = {};
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [{ name: { contains: q.search } }, { code: { contains: q.search } }, { contactPerson: { contains: q.search } }];
  }

  const total = await prisma.institute.count({ where });
  const institutes = await prisma.institute.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit });
  return res.json({ institutes, metadata: { page, limit, total } });
});

// Super admin: approve institute (activates institute + its institute users)
institutesRouter.post('/:id/approve', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const instituteId = z.coerce.number().int().positive().parse(req.params.id);

  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) return res.status(404).json({ error: 'NOT_FOUND' });

  await prisma.$transaction(async (tx) => {
    await tx.institute.update({ where: { id: instituteId }, data: { status: 'APPROVED' } });
    const instituteRole = await tx.role.findUnique({ where: { name: 'INSTITUTE' } });
    if (!instituteRole) throw new Error('ROLE_MISSING');
    await tx.user.updateMany({
      where: { instituteId, roleId: instituteRole.id },
      data: { status: 'ACTIVE' }
    });
  });

  return res.json({ ok: true });
});

