import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const institutesRouter = Router();

// Super admin: get all institutes (all statuses) - MUST come before the generic GET /
institutesRouter.get('/all', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const institutes = await prisma.institute.findMany({
      orderBy: [{ district: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        collegeNo: true,
        udiseNo: true,
        district: true,
        city: true,
        address: true,
        contactPerson: true,
        contactEmail: true,
        contactMobile: true,
        status: true,
        acceptingApplications: true,
        createdAt: true
      }
    });
    return res.json({ institutes });
  } catch (err) {
    console.error('Error fetching all institutes:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

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

// Super admin: create new institute
institutesRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const body = z
      .object({
        name: z.string().min(3).max(200),
        code: z.string().min(2).max(50).optional(),
        collegeNo: z.string().min(1).max(20).optional(),
        udiseNo: z.string().min(1).max(20).optional(),
        address: z.string().max(500).optional(),
        district: z.string().max(100).optional(),
        taluka: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        pincode: z.string().max(10).optional(),
        contactPerson: z.string().max(100).optional(),
        contactEmail: z.string().email().optional(),
        contactMobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
        username: z.string().min(3).optional(),
        password: z.string().min(8).optional(),
        status: z.enum(['APPROVED', 'PENDING']).optional(),
        acceptingApplications: z.boolean().optional(),
        examApplicationLimit: z.number().int().positive().optional()
      })
      .parse(req.body);

    // Validate institute code - enforce uppercase
    const instituteCode = body.code ? String(body.code).toUpperCase() : `INST-${Date.now()}`;

    // Check if institute with same code already exists
    if (body.code) {
      const existing = await prisma.institute.findUnique({ where: { code: instituteCode } });
      if (existing) {
        return res.status(409).json({ error: 'INSTITUTE_CODE_ALREADY_EXISTS', message: 'An institute with this code already exists' });
      }
    }

    // Create new institute
    const institute = await prisma.institute.create({
      data: {
        name: body.name,
        code: instituteCode,
        collegeNo: body.collegeNo || 'TBD',
        udiseNo: body.udiseNo || 'TBD',
        address: body.address,
        district: body.district,
        taluka: body.taluka,
        city: body.city,
        pincode: body.pincode,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        contactMobile: body.contactMobile,
        status: body.status || 'PENDING',
        acceptingApplications: body.acceptingApplications ?? true,
        examApplicationLimit: body.examApplicationLimit || 100
      }
    });

    // Create institute admin user if credentials provided
    let adminUser = null;
    if (body.username && body.password) {
      const existingUser = await prisma.user.findUnique({ where: { username: body.username } });
      if (existingUser) {
        return res.status(409).json({ error: 'USERNAME_TAKEN', message: 'Username already exists' });
      }

      const instituteRole = await prisma.role.findUnique({ where: { name: 'INSTITUTE' } });
      if (!instituteRole) {
        return res.status(500).json({ error: 'ROLE_MISSING', message: 'INSTITUTE role not found' });
      }

      adminUser = await prisma.user.create({
        data: {
          username: body.username,
          passwordHash: await bcrypt.hash(body.password, 10),
          roleId: instituteRole.id,
          instituteId: institute.id,
          status: 'ACTIVE',
          email: body.contactEmail,
          mobile: body.contactMobile
        }
      });
    }

    return res.status(201).json({
      ok: true,
      institute: {
        id: institute.id,
        name: institute.name,
        code: institute.code,
        collegeNo: institute.collegeNo,
        udiseNo: institute.udiseNo,
        status: institute.status,
        createdAt: institute.createdAt
      },
      adminUser: adminUser ? {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email
      } : null
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      // Zod validation errors
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
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
      contactMobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
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
    mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional()
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
      mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional()
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
      mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
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

// Board: list teachers across institutes (for board dashboards)
institutesRouter.get('/board/teachers', requireAuth, requireRole(['BOARD']), async (req, res) => {
  try {
    const q = z
      .object({
        search: z.string().optional(),
        active: z.string().optional(),
        institute: z.string().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(200).optional()
      })
      .parse(req.query);

    const where = {};
    if (q.search) {
      where.OR = [
        { fullName: { contains: q.search } },
        { designation: { contains: q.search } },
        { subjectSpecialization: { contains: q.search } },
        { email: { contains: q.search } },
        { mobile: { contains: q.search } }
      ];
    }
    if (q.active !== undefined) {
      where.active = q.active === 'true';
    }
    if (q.institute) {
      where.institute = {
        OR: [
          { name: { contains: q.institute } },
          { code: { contains: q.institute } }
        ]
      };
    }

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const total = await prisma.teacher.count({ where });
    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        institute: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const activeCount = await prisma.teacher.count({ where: { ...where, active: true } });
    const inactiveCount = await prisma.teacher.count({ where: { ...where, active: false } });

    return res.json({
      teachers,
      metadata: {
        page,
        limit,
        total,
        activeCount,
        inactiveCount
      }
    });
  } catch (err) {
    console.error('Error fetching board teachers:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Board: toggle teacher active status
institutesRouter.patch('/board/teachers/:id', requireAuth, requireRole(['BOARD']), async (req, res) => {
  try {
    const teacherId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({ active: z.boolean() }).parse(req.body);

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) return res.status(404).json({ error: 'TEACHER_NOT_FOUND' });

    const updated = await prisma.teacher.update({
      where: { id: teacherId },
      data: { active: body.active }
    });

    return res.json({ teacher: updated });
  } catch (err) {
    console.error('Error updating teacher:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Super admin & Institute: Search institutes
institutesRouter.get('/search', requireAuth, async (req, res) => {
  try {
    const q = z.object({
      query: z.string().optional().default('')
    }).parse(req.query);

    const searchTerm = q.query.toLowerCase();
    const institutes = await prisma.institute.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { district: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        district: true,
        city: true,
        status: true
      },
      take: 20
    });

    return res.json({ institutes });
  } catch (err) {
    console.error('Error searching institutes:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get teachers for current institute
institutesRouter.get('/me/teachers', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const teachers = await prisma.teacher.findMany({
      where: { instituteId: user.institute.id },
      orderBy: { createdAt: 'desc' },
      include: {
        institute: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return res.json({ teachers });
  } catch (err) {
    console.error('Error fetching teachers:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Add teacher for current institute
institutesRouter.post('/me/teachers', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const body = z.object({
      fullName: z.string().min(2).max(100),
      designation: z.string().max(100).optional(),
      subjectSpecialization: z.string().max(100).optional(),
      qualification: z.string().max(100).optional(),
      dob: z.string().optional(), // YYYY-MM-DD
      appointmentDate: z.string().optional(),
      gender: z.enum(['Male', 'Female', 'Other']).optional(),
      governmentId: z.string().min(1).max(50),
      casteCategory: z.string().max(50).optional(),
      serviceStartDate: z.string().optional(),
      leavingNote: z.string().optional(),
      certificates: z.string().optional(),
      certifications: z.string().optional(),
      teacherType: z.enum(['Government', 'Contract', 'Adhoc', 'Temporary']).optional(),
      email: z.string().email().optional(),
      mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
      active: z.boolean().optional().default(true)
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    // Check if government ID already exists for this institute
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        governmentId: body.governmentId,
        instituteId: user.institute.id
      }
    });

    if (existingTeacher) {
      return res.status(409).json({
        error: 'DUPLICATE_GOVERNMENT_ID',
        message: 'Teacher with this government ID already exists in this institute',
        existingTeacher: {
          id: existingTeacher.id,
          fullName: existingTeacher.fullName
        }
      });
    }

    const teacher = await prisma.teacher.create({
      data: {
        fullName: body.fullName,
        designation: body.designation,
        subjectSpecialization: body.subjectSpecialization,
        qualification: body.qualification,
        dob: body.dob ? new Date(body.dob) : null,
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : null,
        gender: body.gender,
        governmentId: body.governmentId,
        casteCategory: body.casteCategory,
        serviceStartDate: body.serviceStartDate ? new Date(body.serviceStartDate) : null,
        leavingNote: body.leavingNote,
        certificates: body.certificates,
        certifications: body.certifications,
        teacherType: body.teacherType,
        email: body.email,
        mobile: body.mobile,
        active: body.active,
        instituteId: user.institute.id
      },
      include: {
        institute: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return res.status(201).json({ ok: true, teacher });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error adding teacher:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Check teacher history by government ID
institutesRouter.get('/me/teachers/history', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const q = z.object({
      governmentId: z.string().min(1)
    }).parse(req.query);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    // Find all instances of this government ID in the current institute
    const teachers = await prisma.teacher.findMany({
      where: {
        governmentId: q.governmentId,
        instituteId: user.institute.id
      },
      include: {
        institute: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      governmentId: q.governmentId,
      count: teachers.length,
      teachers
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error fetching teacher history:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get all available streams and subjects for the institute
institutesRouter.get('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    // Get all streams
    const allStreams = await prisma.stream.findMany({
      orderBy: { name: 'asc' },
      include: {
        streamSubjects: {
          include: { subject: true },
          orderBy: { subject: { name: 'asc' } }
        }
      }
    });

    // Get institute's current stream-subject mappings
    const instituteStreamSubjects = await prisma.instituteStreamSubject.findMany({
      where: { instituteId: user.institute.id },
      include: {
        stream: true,
        subject: true
      }
    });

    // Build the response structure
    const streams = allStreams.map(stream => ({
      id: stream.id,
      name: stream.name,
      isSelected: instituteStreamSubjects.some(iss => iss.streamId === stream.id),
      subjects: stream.streamSubjects.map(ss => ({
        id: ss.subject.id,
        name: ss.subject.name,
        code: ss.subject.code,
        category: ss.subject.category,
        isSelected: instituteStreamSubjects.some(
          iss => iss.streamId === stream.id && iss.subjectId === ss.subject.id
        )
      }))
    }));

    return res.json({ 
      ok: true, 
      instituteId: user.institute.id,
      streams 
    });
  } catch (err) {
    console.error('Error fetching stream-subjects:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update stream-subject mappings for the institute
institutesRouter.post('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const body = z
      .object({
        streamSubjects: z.array(
          z.object({
            streamId: z.coerce.number().int().positive(),
            subjectIds: z.array(z.coerce.number().int().positive())
          })
        )
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const instituteId = user.institute.id;

    // Validate that all streams and subjects exist
    const streamIds = body.streamSubjects.map(ss => ss.streamId);
    const allSubjectIds = [
      ...new Set(body.streamSubjects.flatMap(ss => ss.subjectIds))
    ];

    const streamCount = await prisma.stream.count({
      where: { id: { in: streamIds } }
    });
    if (streamCount !== streamIds.length) {
      return res.status(400).json({ error: 'INVALID_STREAM', message: 'One or more streams do not exist' });
    }

    const subjectCount = await prisma.subject.count({
      where: { id: { in: allSubjectIds } }
    });
    if (subjectCount !== allSubjectIds.length) {
      return res.status(400).json({ error: 'INVALID_SUBJECT', message: 'One or more subjects do not exist' });
    }

    // Delete all existing mappings for this institute
    await prisma.instituteStreamSubject.deleteMany({
      where: { instituteId }
    });

    // Create new mappings
    const mappings = [];
    for (const streamSubject of body.streamSubjects) {
      for (const subjectId of streamSubject.subjectIds) {
        mappings.push({
          instituteId,
          streamId: streamSubject.streamId,
          subjectId
        });
      }
    }

    const created = await prisma.instituteStreamSubject.createMany({
      data: mappings
    });

    return res.status(201).json({
      ok: true,
      message: `Created ${created.count} stream-subject mappings`,
      count: created.count
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error updating stream-subjects:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get profile completion status
institutesRouter.get('/me/status', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const institute = user.institute;

    // Check if all required fields are filled
    const isProfileComplete = !![
      institute.address,
      institute.district,
      institute.city,
      institute.contactPerson,
      institute.contactEmail,
      institute.contactMobile
    ].every(v => v && String(v).trim().length > 0);

    return res.json({
      ok: true,
      profileComplete: isProfileComplete,
      institute: {
        id: institute.id,
        name: institute.name,
        code: institute.code,
        collegeNo: institute.collegeNo,
        udiseNo: institute.udiseNo,
        status: institute.status
      }
    });
  } catch (err) {
    console.error('Error fetching institute status:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get current institute details
institutesRouter.get('/me', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const institute = user.institute;

    return res.json({
      ok: true,
      institute: {
        id: institute.id,
        name: institute.name,
        code: institute.code,
        collegeNo: institute.collegeNo,
        udiseNo: institute.udiseNo,
        address: institute.address,
        district: institute.district,
        taluka: institute.taluka,
        city: institute.city,
        pincode: institute.pincode,
        contactPerson: institute.contactPerson,
        contactEmail: institute.contactEmail,
        contactMobile: institute.contactMobile,
        status: institute.status,
        acceptingApplications: institute.acceptingApplications,
        examApplicationLimit: institute.examApplicationLimit,
        createdAt: institute.createdAt
      }
    });
  } catch (err) {
    console.error('Error fetching institute details:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update institute details
institutesRouter.patch('/me', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const body = z
      .object({
        name: z.string().min(3).max(200).optional(),
        address: z.string().max(500).optional(),
        district: z.string().max(100).optional(),
        taluka: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        pincode: z.string().max(10).optional(),
        contactPerson: z.string().max(100).optional(),
        contactEmail: z.string().email().optional(),
        contactMobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
        acceptingApplications: z.boolean().optional(),
        examApplicationLimit: z.number().int().positive().optional()
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { institute: true }
    });

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.taluka !== undefined) updateData.taluka = body.taluka;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.pincode !== undefined) updateData.pincode = body.pincode;
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
    if (body.contactMobile !== undefined) updateData.contactMobile = body.contactMobile;
    if (body.acceptingApplications !== undefined) updateData.acceptingApplications = body.acceptingApplications;
    if (body.examApplicationLimit !== undefined) updateData.examApplicationLimit = body.examApplicationLimit;

    const updated = await prisma.institute.update({
      where: { id: user.institute.id },
      data: updateData
    });

    return res.json({
      ok: true,
      institute: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        collegeNo: updated.collegeNo,
        udiseNo: updated.udiseNo,
        address: updated.address,
        district: updated.district,
        taluka: updated.taluka,
        city: updated.city,
        pincode: updated.pincode,
        contactPerson: updated.contactPerson,
        contactEmail: updated.contactEmail,
        contactMobile: updated.contactMobile,
        status: updated.status,
        acceptingApplications: updated.acceptingApplications,
        examApplicationLimit: updated.examApplicationLimit,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error updating institute details:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

