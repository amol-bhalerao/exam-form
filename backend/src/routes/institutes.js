import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const institutesRouter = Router();

const instituteDetailsSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  name: z.string().min(3).max(200).optional(),
  address: z.string().max(500).optional(),
  district: z.string().max(100).optional(),
  taluka: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  contactPerson: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactMobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional()
});

const TEACHER_TYPE_OPTIONS = [
  'Aided',
  'Partially Aided 80',
  'Partially Aided 60',
  'Partially Aided 40',
  'Partially Aided 20',
  'Unaided',
  'Permanent Unaided',
  'Self Financed'
];

const teacherPayloadSchema = z.object({
  fullName: z.string().min(2).max(150),
  designation: z.string().max(100).optional(),
  subjectSpecialization: z.string().max(150).optional(),
  qualification: z.string().max(255).optional(),
  dob: z.string().optional(),
  appointmentDate: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  governmentId: z.string().min(1).max(20),
  casteCategory: z.string().max(50).optional(),
  serviceStartDate: z.string().optional(),
  leavingDate: z.string().optional(),
  leavingNote: z.string().optional(),
  certificates: z.string().optional(),
  certifications: z.string().optional(),
  teacherType: z.enum(TEACHER_TYPE_OPTIONS).optional(),
  examinerExperienceYears: z.coerce.number().min(0).max(80).optional(),
  previousExaminerAppointmentNo: z.string().max(100).optional(),
  moderatorExperienceYears: z.coerce.number().min(0).max(80).optional(),
  lastModeratorName: z.string().max(150).optional(),
  lastModeratorAppointmentNo: z.string().max(100).optional(),
  lastModeratorCollegeName: z.string().max(200).optional(),
  chiefModeratorExperienceYears: z.coerce.number().min(0).max(80).optional(),
  lastChiefModeratorName: z.string().max(150).optional(),
  lastChiefModeratorAppointmentNo: z.string().max(100).optional(),
  lastChiefModeratorCollegeName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional(),
  active: z.boolean().optional().default(true)
});

function parseOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(Math.max(parsed, 0).toFixed(1));
}

const STUDENT_STREAM_CODE_LOOKUP = {
  '1': 'Science',
  '2': 'Arts',
  '3': 'Commerce',
  '4': 'Vocational',
  '5': 'Technology'
};

function resolveStreamIdFromValue(streamValue, streams = [], fallbackStreamId = null) {
  if (streamValue === undefined || streamValue === null || streamValue === '') {
    return fallbackStreamId;
  }

  const normalized = String(streamValue).trim().toLowerCase();
  const requested = String(STUDENT_STREAM_CODE_LOOKUP[normalized] || normalized).toLowerCase();
  const matched = streams.find((stream) => {
    const name = String(stream?.name || '').toLowerCase();
    return name === requested || name.includes(requested) || requested.includes(name);
  });

  return matched?.id ?? fallbackStreamId;
}

function calculateTotalYearsService(serviceStartDate) {
  const date = parseOptionalDate(serviceStartDate);
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return 0;
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Number(years.toFixed(1));
}

const MAHARASHTRA_TEACHER_RETIREMENT_AGE = 60;

function calculateRetirementDate(dob, retirementAgeYears = MAHARASHTRA_TEACHER_RETIREMENT_AGE) {
  const date = parseOptionalDate(dob);
  if (!date) return null;

  // Maharashtra teaching-staff rule: retirement is considered on the last day
  // of the month in which the employee attains the retirement age.
  return new Date(date.getFullYear() + retirementAgeYears, date.getMonth() + 1, 0);
}

function toTeacherDto(teacher) {
  const retirementDate = calculateRetirementDate(teacher.dob);
  const totalYearsService = teacher.totalYearsService ?? calculateTotalYearsService(teacher.serviceStartDate);
  const institute = teacher.institute
    ? {
        ...teacher.institute,
        fullAddress: [teacher.institute.address, teacher.institute.city, teacher.institute.district]
          .filter(Boolean)
          .join(', ')
      }
    : undefined;

  return {
    ...teacher,
    institute,
    casteCategory: teacher.casterCategory ?? teacher.casteCategory ?? null,
    casterCategory: teacher.casterCategory ?? teacher.casteCategory ?? null,
    joiningDate: teacher.appointmentDate ?? teacher.serviceStartDate ?? null,
    totalYearsService,
    retirementDate,
    examinerExperienceYears: teacher.examinerExperienceYears ?? 0,
    previousExaminerAppointmentNo: teacher.previousExaminerAppointmentNo ?? null,
    hasExaminerExperience: (teacher.examinerExperienceYears ?? 0) > 0,
    moderatorExperienceYears: teacher.moderatorExperienceYears ?? 0,
    lastModeratorName: teacher.lastModeratorName ?? null,
    lastModeratorAppointmentNo: teacher.lastModeratorAppointmentNo ?? null,
    lastModeratorCollegeName: teacher.lastModeratorCollegeName ?? null,
    hasModeratorExperience: (teacher.moderatorExperienceYears ?? 0) > 0,
    chiefModeratorExperienceYears: teacher.chiefModeratorExperienceYears ?? 0,
    lastChiefModeratorName: teacher.lastChiefModeratorName ?? null,
    lastChiefModeratorAppointmentNo: teacher.lastChiefModeratorAppointmentNo ?? null,
    lastChiefModeratorCollegeName: teacher.lastChiefModeratorCollegeName ?? null,
    hasChiefModeratorExperience: (teacher.chiefModeratorExperienceYears ?? 0) > 0,
    seniorPayGradeEligible: typeof totalYearsService === 'number' && totalYearsService >= 12,
    selectionPayGradeEligible: typeof totalYearsService === 'number' && totalYearsService >= 24,
    retirementAge: retirementDate
      ? Math.max(0, retirementDate.getFullYear() - new Date().getFullYear())
      : null
  };
}

async function getInstituteUserWithInstitute(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { institute: true }
  });
}

function toInstituteDetailsDto(institute) {
  return {
    id: institute.id,
    name: institute.name,
    code: institute.code,
    centerNo: institute.code,
    collegeNo: institute.collegeNo,
    uniqueNo: institute.collegeNo,
    udiseNo: institute.udiseNo,
    address: institute.address,
    district: institute.district,
    taluka: institute.taluka,
    pincode: institute.pincode,
    contactEmail: institute.contactEmail,
    contactMobile: institute.contactMobile,
    status: institute.status,
    createdAt: institute.createdAt
  };
}

async function handleInstituteDetailsUpdate(req, res) {
  try {
    const body = instituteDetailsSchema.parse(req.body);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const updateData = {};
    if (body.code !== undefined) {
      const normalizedCode = String(body.code).trim().toUpperCase();
      if (!normalizedCode) {
        updateData.code = null;
      } else {
        const existingInstitute = await prisma.institute.findFirst({
          where: {
            code: normalizedCode,
            NOT: { id: user.institute.id }
          }
        });
        if (existingInstitute) {
          return res.status(409).json({ error: 'CENTER_NO_ALREADY_EXISTS', message: 'This Center No is already used by another institute.' });
        }
        updateData.code = normalizedCode;
      }
    }
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.taluka !== undefined) updateData.taluka = body.taluka;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.pincode !== undefined) updateData.pincode = body.pincode;
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
    if (body.contactMobile !== undefined) updateData.contactMobile = body.contactMobile;

    const updated = await prisma.institute.update({
      where: { id: user.institute.id },
      data: updateData
    });

    return res.json({
      ok: true,
      institute: toInstituteDetailsDto(updated)
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error updating institute details:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
}

function isAnswerLanguageMigrationError(err) {
  return String(err?.message || '').includes('institute_stream_subjects.answerLanguageCode');
}

function sendAnswerLanguageMigrationError(res) {
  return res.status(503).json({
    error: 'DATABASE_MIGRATION_REQUIRED',
    message: 'Database update required for answer-language subject mapping. Run `npm --prefix backend run db:sync` and restart the backend.'
  });
}

function getFallbackSubjectCategoriesForStream(streamName) {
  const normalized = String(streamName || '').trim().toUpperCase();
  const commonCategories = ['Language', 'Compulsory', 'Optional Subjects', 'LANGUAGE', 'ELECTIVE'];

  if (normalized.includes('SCIENCE') || normalized.includes('TECHNOLOGY')) {
    return [...commonCategories, 'SCIENCE', 'Bifocal Subjects'];
  }
  if (normalized.includes('COMMERCE')) {
    return [...commonCategories, 'COMMERCE', 'Bifocal Subjects'];
  }
  if (normalized.includes('ART')) {
    return [...commonCategories, 'ARTS'];
  }
  if (normalized.includes('VOC')) {
    return ['Language', 'Compulsory', 'Vocational Subjects', 'HSC.VOC', 'LANGUAGE', 'ELECTIVE'];
  }

  return commonCategories;
}

async function getInstituteExamCapacityRows(instituteId, { openOnly = false } = {}) {
  const now = new Date();
  const examWhere = openOnly
    ? { applicationClose: { gte: now } }
    : {};

  const exams = await prisma.exam.findMany({
    where: examWhere,
    include: { stream: true },
    orderBy: [{ applicationClose: 'desc' }, { createdAt: 'desc' }]
  });

  if (exams.length === 0) {
    return [];
  }

  const examIds = exams.map((exam) => exam.id);
  const [mappedStreamRows, allStreams, capacityRows, applications] = await Promise.all([
    prisma.instituteStreamSubject.findMany({
      where: { instituteId },
      distinct: ['streamId'],
      include: { stream: true }
    }),
    prisma.stream.findMany({ orderBy: { name: 'asc' } }),
    prisma.instituteExamCapacity.findMany({
      where: { instituteId, examId: { in: examIds } },
      include: { stream: true }
    }),
    prisma.examApplication.findMany({
      where: { instituteId, examId: { in: examIds } },
      select: {
        examId: true,
        student: {
          select: { streamCode: true }
        }
      }
    })
  ]);

  const streamCandidates = [
    ...mappedStreamRows.map((row) => row.stream).filter(Boolean),
    ...exams.map((exam) => exam.stream).filter(Boolean),
    ...allStreams
  ];
  const streams = Array.from(new Map(streamCandidates.map((stream) => [stream.id, stream])).values());
  const examsById = new Map(exams.map((exam) => [exam.id, exam]));
  const capacityMap = new Map(capacityRows.map((row) => [`${row.examId}:${row.streamId}`, row]));
  const usageMap = new Map();

  for (const app of applications) {
    const exam = examsById.get(app.examId);
    const streamId = resolveStreamIdFromValue(app.student?.streamCode, streams, exam?.streamId ?? null);
    if (!streamId) continue;
    const key = `${app.examId}:${streamId}`;
    usageMap.set(key, (usageMap.get(key) ?? 0) + 1);
  }

  return exams.flatMap((exam) =>
    streams.map((stream) => {
      const key = `${exam.id}:${stream.id}`;
      const configured = capacityMap.get(key);
      const totalStudents = configured?.totalStudents ?? null;
      const applicationsUsed = usageMap.get(key) ?? 0;
      const remainingApplications = totalStudents === null ? null : Math.max(totalStudents - applicationsUsed, 0);

      return {
        examId: exam.id,
        examName: exam.name,
        academicYear: exam.academicYear,
        session: exam.session,
        streamId: stream.id,
        streamName: stream.name ?? '',
        applicationOpen: exam.applicationOpen,
        applicationClose: exam.applicationClose,
        totalStudents,
        applicationsUsed,
        remainingApplications,
        isConfigured: totalStudents !== null,
        isCapacityReached: totalStudents !== null ? applicationsUsed >= totalStudents : false
      };
    })
  );
}

/**
 * STUDENT ONBOARDING FLOW:
 * 1. Student logs in → Frontend calls GET /api/students/setup-status
 * 2. If instituteSelected = false:
 *    - Show institute selection screen (GET /api/institutes - returns ALL institutes to students)
 *    - Student selects institute and stream → POST /api/students/select-institute
 * 3. If instituteSelected = true but profileComplete = false:
 *    - Show profile setup screen
 *    - Student fills profile (firstName, lastName, motherName, etc.) → PATCH /api/students/me
 * 4. If both = true → Allow dashboard access and exam applications
 * 
 * KEY DESIGN DECISIONS:
 * - Students see ALL institutes (status doesn't matter for student visibility)
 * - Institute status only affects INSTITUTE user (admin) login capability
 * - Students can only apply for ACTIVE exams (regardless of institute status)
 * - Once institute selected, cannot be changed
 */

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

// Super admin: get institute statistics (status breakdown)
institutesRouter.get('/admin/stats', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const [total, approved, pending, rejected, disabled, accepting] = await Promise.all([
      prisma.institute.count(),
      prisma.institute.count({ where: { status: 'APPROVED' } }),
      prisma.institute.count({ where: { status: 'PENDING' } }),
      prisma.institute.count({ where: { status: 'REJECTED' } }),
      prisma.institute.count({ where: { status: 'DISABLED' } }),
      prisma.institute.count({ where: { acceptingApplications: true } })
    ]);
    
    return res.json({
      total,
      byStatus: { approved, pending, rejected, disabled },
      acceptingApplications: accepting,
      summary: {
        visibleToStudents: approved + pending,
        message: pending > 0 ? `${pending} institutes are PENDING and should be visible to students` : 'All institutes are either APPROVED or in other statuses'
      }
    });
  } catch (err) {
    console.error('Error fetching institute stats:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Super admin: approve all pending institutes
institutesRouter.patch('/admin/approve-all-pending', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await prisma.institute.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' }
    });
    return res.json({
      success: true,
      message: `${result.count} institutes have been approved`,
      count: result.count
    });
  } catch (err) {
    console.error('Error approving pending institutes:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Public: institutes list - Show ALL institutes to everyone (for student selection)
// Status and acceptingApplications filtering handled at application level
institutesRouter.get('/', async (req, res) => {
  try {
    // Return ALL institutes - no filtering by status or acceptingApplications
    // This allows students to select any institute regardless of status
    const institutes = await prisma.institute.findMany({
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
        status: true,
        acceptingApplications: true
      }
    });
    return res.json({ institutes, total: institutes.length });
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
  try {
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
  } catch (err) {
    console.error('Error fetching institute users:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Super admin: get single institute user
institutesRouter.get('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { institute: true, role: true } });
    if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ user });
  } catch (err) {
    console.error('Error fetching institute user:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Super admin: update institute user
institutesRouter.patch('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error updating institute user:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Super admin: change institute user status
institutesRouter.patch('/users/:id/status', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({ status: z.enum(['ACTIVE', 'PENDING', 'DISABLED']) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user || user.role.name !== 'INSTITUTE') return res.status(404).json({ error: 'NOT_FOUND' });
    const updated = await prisma.user.update({ where: { id: userId }, data: { status: body.status } });
    return res.json({ user: updated });
  } catch (err) {
    console.error('Error updating institute user status:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

function getTeacherMergeKey(teacher) {
  const governmentId = normalizeOptionalText(teacher.governmentId);
  if (governmentId) return `gov:${governmentId}`;

  const fullName = normalizeOptionalText(teacher.fullName)?.toLowerCase() ?? 'unknown';
  const dob = teacher.dob ? new Date(teacher.dob).toISOString().slice(0, 10) : 'nodob';
  return `name:${fullName}|${dob}`;
}

function mergeTeacherRecordsForBoard(teachersRaw) {
  const merged = new Map();

  for (const teacher of teachersRaw.map(toTeacherDto)) {
    const key = getTeacherMergeKey(teacher);
    const instituteEntry = teacher.institute
      ? {
          id: teacher.institute.id,
          name: teacher.institute.name,
          code: teacher.institute.code,
          district: teacher.institute.district,
          fullAddress: teacher.institute.fullAddress || teacher.institute.address || '',
          active: teacher.active,
          teacherType: teacher.teacherType ?? '',
          designation: teacher.designation ?? ''
        }
      : null;

    if (!merged.has(key)) {
      merged.set(key, {
        ...teacher,
        sourceTeacherIds: [teacher.id],
        institutes: instituteEntry ? [instituteEntry] : [],
        instituteCount: instituteEntry ? 1 : 0,
        instituteNames: instituteEntry?.name ?? ''
      });
      continue;
    }

    const existing = merged.get(key);
    existing.sourceTeacherIds = Array.from(new Set([...(existing.sourceTeacherIds || []), teacher.id]));
    existing.active = existing.active || !!teacher.active;
    existing.dob = existing.dob || teacher.dob;
    existing.email = existing.email || teacher.email;
    existing.mobile = existing.mobile || teacher.mobile;
    existing.subjectSpecialization = Array.from(new Set([existing.subjectSpecialization, teacher.subjectSpecialization].filter(Boolean))).join(', ');
    existing.designation = Array.from(new Set([existing.designation, teacher.designation].filter(Boolean))).join(', ');
    existing.teacherType = Array.from(new Set([existing.teacherType, teacher.teacherType].filter(Boolean))).join(', ');

    const existingJoinDate = parseOptionalDate(existing.joiningDate ?? existing.serviceStartDate ?? existing.appointmentDate);
    const nextJoinDate = parseOptionalDate(teacher.joiningDate ?? teacher.serviceStartDate ?? teacher.appointmentDate);
    if (!existingJoinDate || (nextJoinDate && nextJoinDate < existingJoinDate)) {
      existing.joiningDate = teacher.joiningDate ?? teacher.serviceStartDate ?? teacher.appointmentDate ?? existing.joiningDate;
      existing.serviceStartDate = teacher.serviceStartDate ?? existing.serviceStartDate;
      existing.appointmentDate = teacher.appointmentDate ?? existing.appointmentDate;
    }

    const derivedTotalYears = calculateTotalYearsService(existing.serviceStartDate ?? existing.joiningDate);
    existing.totalYearsService = derivedTotalYears ?? Math.max(existing.totalYearsService ?? 0, teacher.totalYearsService ?? 0);
    existing.retirementDate = existing.retirementDate ?? teacher.retirementDate;

    if ((teacher.examinerExperienceYears ?? 0) >= (existing.examinerExperienceYears ?? 0)) {
      existing.examinerExperienceYears = teacher.examinerExperienceYears ?? 0;
      existing.previousExaminerAppointmentNo = teacher.previousExaminerAppointmentNo ?? existing.previousExaminerAppointmentNo ?? null;
    }

    if ((teacher.moderatorExperienceYears ?? 0) >= (existing.moderatorExperienceYears ?? 0)) {
      existing.moderatorExperienceYears = teacher.moderatorExperienceYears ?? 0;
      existing.lastModeratorName = teacher.lastModeratorName ?? existing.lastModeratorName ?? null;
      existing.lastModeratorAppointmentNo = teacher.lastModeratorAppointmentNo ?? existing.lastModeratorAppointmentNo ?? null;
      existing.lastModeratorCollegeName = teacher.lastModeratorCollegeName ?? existing.lastModeratorCollegeName ?? null;
    }

    if ((teacher.chiefModeratorExperienceYears ?? 0) >= (existing.chiefModeratorExperienceYears ?? 0)) {
      existing.chiefModeratorExperienceYears = teacher.chiefModeratorExperienceYears ?? 0;
      existing.lastChiefModeratorName = teacher.lastChiefModeratorName ?? existing.lastChiefModeratorName ?? null;
      existing.lastChiefModeratorAppointmentNo = teacher.lastChiefModeratorAppointmentNo ?? existing.lastChiefModeratorAppointmentNo ?? null;
      existing.lastChiefModeratorCollegeName = teacher.lastChiefModeratorCollegeName ?? existing.lastChiefModeratorCollegeName ?? null;
    }

    if (instituteEntry && !existing.institutes.some((item) => item.id === instituteEntry.id)) {
      existing.institutes.push(instituteEntry);
      existing.instituteCount = existing.institutes.length;
      existing.instituteNames = existing.institutes.map((item) => item.name).filter(Boolean).join(', ');
    }
  }

  return Array.from(merged.values())
    .map((teacher) => ({
      ...teacher,
      seniorPayGradeEligible: typeof teacher.totalYearsService === 'number' && teacher.totalYearsService >= 12,
      selectionPayGradeEligible: typeof teacher.totalYearsService === 'number' && teacher.totalYearsService >= 24
    }))
    .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
}

// Board: list teachers across institutes (for board dashboards)
institutesRouter.get('/board/teachers', requireAuth, requireRole(['BOARD']), async (req, res) => {
  try {
    const q = z
      .object({
        search: z.string().optional(),
        active: z.string().optional(),
        institute: z.string().optional(),
        dutyType: z.enum(['EXAMINER', 'MODERATOR', 'CHIEF_MODERATOR', 'ANY_BOARD_DUTY', 'NONE']).optional(),
        eligibility: z.enum(['SENIOR', 'SELECTION']).optional(),
        multiInstitute: z.string().optional(),
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
    const teachersRaw = await prisma.teacher.findMany({
      where,
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      },
      orderBy: [{ serviceStartDate: 'desc' }, { createdAt: 'desc' }]
    });

    let mergedTeachers = mergeTeacherRecordsForBoard(teachersRaw);

    if (q.search) {
      const searchTerm = q.search.trim().toLowerCase();
      mergedTeachers = mergedTeachers.filter((teacher) =>
        [
          teacher.fullName,
          teacher.governmentId,
          teacher.designation,
          teacher.subjectSpecialization,
          teacher.teacherType,
          teacher.email,
          teacher.mobile,
          teacher.instituteNames
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(searchTerm)
      );
    }

    if (q.dutyType === 'EXAMINER') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.examinerExperienceYears ?? 0) > 0);
    } else if (q.dutyType === 'MODERATOR') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.moderatorExperienceYears ?? 0) > 0);
    } else if (q.dutyType === 'CHIEF_MODERATOR') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.chiefModeratorExperienceYears ?? 0) > 0);
    } else if (q.dutyType === 'ANY_BOARD_DUTY') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.examinerExperienceYears ?? 0) > 0 || (teacher.moderatorExperienceYears ?? 0) > 0 || (teacher.chiefModeratorExperienceYears ?? 0) > 0);
    } else if (q.dutyType === 'NONE') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.examinerExperienceYears ?? 0) <= 0 && (teacher.moderatorExperienceYears ?? 0) <= 0 && (teacher.chiefModeratorExperienceYears ?? 0) <= 0);
    }

    if (q.eligibility === 'SENIOR') {
      mergedTeachers = mergedTeachers.filter((teacher) => teacher.seniorPayGradeEligible);
    } else if (q.eligibility === 'SELECTION') {
      mergedTeachers = mergedTeachers.filter((teacher) => teacher.selectionPayGradeEligible);
    }

    if (q.multiInstitute === 'true') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.instituteCount ?? 0) > 1);
    } else if (q.multiInstitute === 'false') {
      mergedTeachers = mergedTeachers.filter((teacher) => (teacher.instituteCount ?? 0) <= 1);
    }

    const total = mergedTeachers.length;
    const activeCount = mergedTeachers.filter((teacher) => teacher.active).length;
    const inactiveCount = total - activeCount;
    const multiInstituteCount = mergedTeachers.filter((teacher) => (teacher.instituteCount ?? 0) > 1).length;
    const teachers = mergedTeachers.slice((page - 1) * limit, page * limit);

    return res.json({
      teachers,
      metadata: {
        page,
        limit,
        total,
        activeCount,
        inactiveCount,
        multiInstituteCount
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
    const body = z.object({
      active: z.boolean(),
      teacherIds: z.array(z.coerce.number().int().positive()).optional()
    }).parse(req.body);

    const targetIds = Array.from(new Set([teacherId, ...(body.teacherIds || [])]));
    const updated = await prisma.teacher.updateMany({
      where: { id: { in: targetIds } },
      data: { active: body.active }
    });

    if (!updated.count) {
      return res.status(404).json({ error: 'TEACHER_NOT_FOUND' });
    }

    return res.json({ ok: true, updatedCount: updated.count, teacherIds: targetIds, active: body.active });
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
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const teachers = await prisma.teacher.findMany({
      where: { instituteId: user.institute.id },
      orderBy: [{ serviceStartDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      }
    });

    return res.json({ teachers: teachers.map(toTeacherDto) });
  } catch (err) {
    console.error('Error fetching teachers:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Add teacher for current institute
institutesRouter.post('/me/teachers', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const body = teacherPayloadSchema.parse(req.body);
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        governmentId: body.governmentId.trim(),
        instituteId: user.institute.id
      }
    });

    if (existingTeacher) {
      return res.status(409).json({
        error: 'DUPLICATE_GOVERNMENT_ID',
        message: 'Teacher with this Aadhar / government ID already exists in this institute',
        existingTeacher: {
          id: existingTeacher.id,
          fullName: existingTeacher.fullName
        }
      });
    }

    const serviceStartDate = parseOptionalDate(body.serviceStartDate);
    const teacher = await prisma.teacher.create({
      data: {
        fullName: body.fullName,
        designation: body.designation,
        subjectSpecialization: body.subjectSpecialization,
        qualification: body.qualification,
        dob: parseOptionalDate(body.dob),
        appointmentDate: parseOptionalDate(body.appointmentDate),
        gender: body.gender,
        governmentId: body.governmentId.trim(),
        casterCategory: body.casteCategory,
        serviceStartDate,
        leavingDate: parseOptionalDate(body.leavingDate),
        leavingNote: body.leavingNote,
        certificates: body.certificates ?? body.certifications,
        certifications: body.certifications,
        teacherType: body.teacherType ?? TEACHER_TYPE_OPTIONS[0],
        email: body.email,
        mobile: body.mobile,
        examinerExperienceYears: parseOptionalNumber(body.examinerExperienceYears),
        previousExaminerAppointmentNo: normalizeOptionalText(body.previousExaminerAppointmentNo),
        moderatorExperienceYears: parseOptionalNumber(body.moderatorExperienceYears),
        lastModeratorName: normalizeOptionalText(body.lastModeratorName),
        lastModeratorAppointmentNo: normalizeOptionalText(body.lastModeratorAppointmentNo),
        lastModeratorCollegeName: normalizeOptionalText(body.lastModeratorCollegeName),
        chiefModeratorExperienceYears: parseOptionalNumber(body.chiefModeratorExperienceYears),
        lastChiefModeratorName: normalizeOptionalText(body.lastChiefModeratorName),
        lastChiefModeratorAppointmentNo: normalizeOptionalText(body.lastChiefModeratorAppointmentNo),
        lastChiefModeratorCollegeName: normalizeOptionalText(body.lastChiefModeratorCollegeName),
        active: body.active ?? true,
        totalYearsService: calculateTotalYearsService(serviceStartDate),
        instituteId: user.institute.id
      },
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      }
    });

    return res.status(201).json({ ok: true, teacher: toTeacherDto(teacher) });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error adding teacher:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update existing teacher
institutesRouter.put('/me/teachers/:id', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const teacherId = z.coerce.number().int().positive().parse(req.params.id);
    const body = teacherPayloadSchema.partial().parse(req.body);
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: { id: teacherId, instituteId: user.institute.id }
    });
    if (!existingTeacher) {
      return res.status(404).json({ error: 'TEACHER_NOT_FOUND' });
    }

    if (body.governmentId) {
      const duplicate = await prisma.teacher.findFirst({
        where: {
          instituteId: user.institute.id,
          governmentId: body.governmentId.trim(),
          NOT: { id: teacherId }
        }
      });
      if (duplicate) {
        return res.status(409).json({
          error: 'DUPLICATE_GOVERNMENT_ID',
          message: 'Teacher with this Aadhar / government ID already exists in this institute'
        });
      }
    }

    const updateData = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.designation !== undefined) updateData.designation = body.designation;
    if (body.subjectSpecialization !== undefined) updateData.subjectSpecialization = body.subjectSpecialization;
    if (body.qualification !== undefined) updateData.qualification = body.qualification;
    if (body.dob !== undefined) updateData.dob = parseOptionalDate(body.dob);
    if (body.appointmentDate !== undefined) updateData.appointmentDate = parseOptionalDate(body.appointmentDate);
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.governmentId !== undefined) updateData.governmentId = body.governmentId.trim();
    if (body.casteCategory !== undefined) updateData.casterCategory = body.casteCategory;
    if (body.serviceStartDate !== undefined) {
      const serviceStartDate = parseOptionalDate(body.serviceStartDate);
      updateData.serviceStartDate = serviceStartDate;
      updateData.totalYearsService = calculateTotalYearsService(serviceStartDate);
    }
    if (body.leavingDate !== undefined) updateData.leavingDate = parseOptionalDate(body.leavingDate);
    if (body.leavingNote !== undefined) updateData.leavingNote = body.leavingNote;
    if (body.certificates !== undefined) updateData.certificates = body.certificates;
    if (body.certifications !== undefined) updateData.certifications = body.certifications;
    if (body.teacherType !== undefined) updateData.teacherType = body.teacherType;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.examinerExperienceYears !== undefined) updateData.examinerExperienceYears = parseOptionalNumber(body.examinerExperienceYears);
    if (body.previousExaminerAppointmentNo !== undefined) updateData.previousExaminerAppointmentNo = normalizeOptionalText(body.previousExaminerAppointmentNo);
    if (body.moderatorExperienceYears !== undefined) updateData.moderatorExperienceYears = parseOptionalNumber(body.moderatorExperienceYears);
    if (body.lastModeratorName !== undefined) updateData.lastModeratorName = normalizeOptionalText(body.lastModeratorName);
    if (body.lastModeratorAppointmentNo !== undefined) updateData.lastModeratorAppointmentNo = normalizeOptionalText(body.lastModeratorAppointmentNo);
    if (body.lastModeratorCollegeName !== undefined) updateData.lastModeratorCollegeName = normalizeOptionalText(body.lastModeratorCollegeName);
    if (body.chiefModeratorExperienceYears !== undefined) updateData.chiefModeratorExperienceYears = parseOptionalNumber(body.chiefModeratorExperienceYears);
    if (body.lastChiefModeratorName !== undefined) updateData.lastChiefModeratorName = normalizeOptionalText(body.lastChiefModeratorName);
    if (body.lastChiefModeratorAppointmentNo !== undefined) updateData.lastChiefModeratorAppointmentNo = normalizeOptionalText(body.lastChiefModeratorAppointmentNo);
    if (body.lastChiefModeratorCollegeName !== undefined) updateData.lastChiefModeratorCollegeName = normalizeOptionalText(body.lastChiefModeratorCollegeName);
    if (body.active !== undefined) {
      updateData.active = body.active;
      if (body.active) {
        updateData.leavingDate = null;
        updateData.leavingNote = null;
      }
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData,
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      }
    });

    return res.json({ ok: true, teacher: toTeacherDto(updatedTeacher) });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error updating teacher:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update teacher status
institutesRouter.patch('/me/teachers/:id/status', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const teacherId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({ active: z.boolean() }).parse(req.body);
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, instituteId: user.institute.id }
    });
    if (!teacher) {
      return res.status(404).json({ error: 'TEACHER_NOT_FOUND' });
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: body.active
        ? { active: true, leavingDate: null, leavingNote: null }
        : { active: false },
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      }
    });

    return res.json({ ok: true, teacher: toTeacherDto(updatedTeacher) });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error updating teacher status:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Delete teacher
institutesRouter.delete('/me/teachers/:id', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const teacherId = z.coerce.number().int().positive().parse(req.params.id);
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, instituteId: user.institute.id }
    });
    if (!teacher) {
      return res.status(404).json({ error: 'TEACHER_NOT_FOUND' });
    }

    await prisma.teacher.delete({ where: { id: teacherId } });
    return res.json({ ok: true, deletedId: teacherId });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Check teacher history by government ID
institutesRouter.get('/me/teachers/history', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const q = z.object({
      governmentId: z.string().min(1)
    }).parse(req.query);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const teachers = await prisma.teacher.findMany({
      where: {
        governmentId: q.governmentId.trim()
      },
      include: {
        institute: {
          select: { id: true, name: true, code: true, address: true, district: true, city: true }
        }
      },
      orderBy: [{ serviceStartDate: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json({
      governmentId: q.governmentId.trim(),
      count: teachers.length,
      teachers: teachers.map(toTeacherDto)
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

// Student & institute: fetch mapped subjects for a stream with institute fallback
institutesRouter.get('/subject-options', requireAuth, async (req, res) => {
  try {
    const q = z.object({
      instituteId: z.coerce.number().int().positive().optional(),
      streamId: z.coerce.number().int().positive().optional(),
      streamCode: z.string().optional()
    }).parse(req.query);

    let instituteId = q.instituteId;
    if (req.auth.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
      instituteId = student?.instituteId ?? instituteId;
    } else if (req.auth.role === 'INSTITUTE') {
      const user = await getInstituteUserWithInstitute(req.auth.userId);
      instituteId = user?.institute?.id ?? instituteId;
    }

    let streamId = q.streamId;
    let resolvedStreamName = '';
    if (!streamId && q.streamCode) {
      const streamCodeLookup = {
        '1': 'Science',
        '2': 'Arts',
        '3': 'Commerce',
        '4': 'Vocational',
        '5': 'Technology'
      };
      const requestedStream = streamCodeLookup[q.streamCode] || q.streamCode;
      const availableStreams = await prisma.stream.findMany({ select: { id: true, name: true } });
      const matchedStream = availableStreams.find((stream) => {
        const streamName = String(stream.name).toLowerCase();
        const requested = String(requestedStream).toLowerCase();
        return streamName === requested || streamName.includes(requested) || requested.includes(streamName);
      });
      streamId = matchedStream?.id;
      resolvedStreamName = matchedStream?.name || String(requestedStream || '');
    }

    if (!resolvedStreamName && streamId) {
      const streamRecord = await prisma.stream.findUnique({ where: { id: streamId }, select: { name: true } });
      resolvedStreamName = streamRecord?.name || q.streamCode || '';
    }

    if (!streamId) {
      const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
      return res.json({
        ok: true,
        source: 'all',
        instituteId: instituteId ?? null,
        subjects: subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category,
          answerLanguageCode: null
        }))
      });
    }

    if (instituteId) {
      const mappedSubjects = await prisma.instituteStreamSubject.findMany({
        where: { instituteId, streamId },
        include: { subject: true },
        orderBy: { subject: { name: 'asc' } }
      });

      if (mappedSubjects.length > 0) {
        return res.json({
          ok: true,
          source: 'institute',
          instituteId,
          streamId,
          subjects: mappedSubjects.map((mapping) => ({
            id: mapping.subject.id,
            mappingId: mapping.id,
            name: mapping.subject.name,
            code: mapping.subject.code,
            category: mapping.subject.category,
            answerLanguageCode: mapping.answerLanguageCode ?? null
          }))
        });
      }
    }

    const streamSubjects = await prisma.streamSubject.findMany({
      where: { streamId },
      include: { subject: true },
      orderBy: { subject: { name: 'asc' } }
    });

    if (streamSubjects.length > 0) {
      return res.json({
        ok: true,
        source: 'stream',
        instituteId: instituteId ?? null,
        streamId,
        subjects: streamSubjects.map((mapping) => ({
          id: mapping.subject.id,
          name: mapping.subject.name,
          code: mapping.subject.code,
          category: mapping.subject.category,
          answerLanguageCode: null
        }))
      });
    }

    const fallbackCategories = getFallbackSubjectCategoriesForStream(resolvedStreamName || q.streamCode || '');
    const subjects = await prisma.subject.findMany({
      where: fallbackCategories.length ? { category: { in: fallbackCategories } } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    return res.json({
      ok: true,
      source: 'stream',
      instituteId: instituteId ?? null,
      streamId,
      subjects: subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        answerLanguageCode: null
      }))
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    if (isAnswerLanguageMigrationError(err)) {
      return sendAnswerLanguageMigrationError(res);
    }
    console.error('Error fetching subject options:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get all available streams and subjects for the institute
institutesRouter.get('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const user = await getInstituteUserWithInstitute(req.auth.userId);

    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const mappings = await prisma.instituteStreamSubject.findMany({
      where: { instituteId: user.institute.id },
      include: {
        stream: true,
        subject: true
      },
      orderBy: [{ stream: { name: 'asc' } }, { subject: { name: 'asc' } }]
    });

    const streamMap = new Map();

    mappings.forEach((mapping) => {
      const streamId = mapping.stream.id;

      if (!streamMap.has(streamId)) {
        streamMap.set(streamId, {
          id: mapping.stream.id,
          name: mapping.stream.name,
          isSelected: true,
          subjects: []
        });
      }

      streamMap.get(streamId).subjects.push({
        mappingId: mapping.id,
        id: mapping.subject.id,
        name: mapping.subject.name,
        code: mapping.subject.code,
        category: mapping.subject.category,
        answerLanguageCode: mapping.answerLanguageCode ?? '',
        isSelected: true
      });
    });

    return res.json({
      ok: true,
      instituteId: user.institute.id,
      streams: Array.from(streamMap.values()),
      mappings: mappings.map((mapping) => ({
        id: mapping.id,
        streamId: mapping.streamId,
        streamName: mapping.stream.name,
        subjectId: mapping.subjectId,
        subjectName: mapping.subject.name,
        subjectCode: mapping.subject.code,
        category: mapping.subject.category,
        answerLanguageCode: mapping.answerLanguageCode ?? ''
      }))
    });
  } catch (err) {
    if (isAnswerLanguageMigrationError(err)) {
      return sendAnswerLanguageMigrationError(res);
    }
    console.error('Error fetching stream-subjects:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Create stream-subject mappings for the institute
institutesRouter.post('/me/stream-subjects', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const body = z.object({
      streamSubjects: z.array(
        z.object({
          streamId: z.coerce.number().int().positive(),
          subjectIds: z.array(z.coerce.number().int().positive()).optional(),
          subjects: z.array(
            z.object({
              subjectId: z.coerce.number().int().positive(),
              answerLanguageCode: z.string().max(10).optional()
            })
          ).optional()
        })
      )
    }).parse(req.body);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const instituteId = user.institute.id;
    const normalizedStreamSubjects = body.streamSubjects.map((streamSubject) => ({
      streamId: streamSubject.streamId,
      subjects: streamSubject.subjects && streamSubject.subjects.length > 0
        ? streamSubject.subjects
        : (streamSubject.subjectIds ?? []).map((subjectId) => ({ subjectId }))
    }));

    const streamIds = normalizedStreamSubjects.map((ss) => ss.streamId);
    const allSubjectIds = [
      ...new Set(normalizedStreamSubjects.flatMap((ss) => ss.subjects.map((subject) => subject.subjectId)))
    ];

    const streamCount = await prisma.stream.count({ where: { id: { in: streamIds } } });
    if (streamCount !== streamIds.length) {
      return res.status(400).json({ error: 'INVALID_STREAM', message: 'One or more streams do not exist' });
    }

    const subjectCount = await prisma.subject.count({ where: { id: { in: allSubjectIds } } });
    if (subjectCount !== allSubjectIds.length) {
      return res.status(400).json({ error: 'INVALID_SUBJECT', message: 'One or more subjects do not exist' });
    }

    const existingMappings = await prisma.instituteStreamSubject.findMany({
      where: {
        instituteId,
        streamId: { in: streamIds }
      }
    });

    const existingPairs = new Set(
      existingMappings.map((mapping) => `${mapping.streamId}:${mapping.subjectId}`)
    );

    const mappingsToAdd = [];
    let duplicatesSkipped = 0;

    for (const streamSubject of normalizedStreamSubjects) {
      for (const subject of streamSubject.subjects) {
        const pairKey = `${streamSubject.streamId}:${subject.subjectId}`;
        if (existingPairs.has(pairKey)) {
          duplicatesSkipped += 1;
          continue;
        }

        mappingsToAdd.push({
          instituteId,
          streamId: streamSubject.streamId,
          subjectId: subject.subjectId,
          answerLanguageCode: subject.answerLanguageCode || null
        });
        existingPairs.add(pairKey);
      }
    }

    let createdCount = 0;
    if (mappingsToAdd.length > 0) {
      const created = await prisma.instituteStreamSubject.createMany({
        data: mappingsToAdd,
        skipDuplicates: true
      });
      createdCount = created.count;
    }

    let message = `Added ${createdCount} new mapping(s)`;
    if (duplicatesSkipped > 0) {
      message += `. Skipped ${duplicatesSkipped} duplicate mapping(s).`;
    }

    return res.status(201).json({
      ok: true,
      message,
      count: createdCount,
      duplicatesSkipped
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    if (isAnswerLanguageMigrationError(err)) {
      return sendAnswerLanguageMigrationError(res);
    }
    console.error('Error updating stream-subjects:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update one mapped subject row
institutesRouter.put('/me/stream-subjects/:id', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const mappingId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({
      streamId: z.coerce.number().int().positive(),
      subjectId: z.coerce.number().int().positive(),
      answerLanguageCode: z.string().max(10).optional()
    }).parse(req.body);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const existing = await prisma.instituteStreamSubject.findFirst({
      where: { id: mappingId, instituteId: user.institute.id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'MAPPING_NOT_FOUND' });
    }

    const duplicate = await prisma.instituteStreamSubject.findFirst({
      where: {
        instituteId: user.institute.id,
        streamId: body.streamId,
        subjectId: body.subjectId,
        NOT: { id: mappingId }
      }
    });
    if (duplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_MAPPING',
        message: 'This stream and subject combination already exists.'
      });
    }

    const mapping = await prisma.instituteStreamSubject.update({
      where: { id: mappingId },
      data: {
        streamId: body.streamId,
        subjectId: body.subjectId,
        answerLanguageCode: body.answerLanguageCode || null
      },
      include: {
        stream: true,
        subject: true
      }
    });

    return res.json({
      ok: true,
      mapping: {
        id: mapping.id,
        streamId: mapping.streamId,
        streamName: mapping.stream.name,
        subjectId: mapping.subjectId,
        subjectName: mapping.subject.name,
        subjectCode: mapping.subject.code,
        category: mapping.subject.category,
        answerLanguageCode: mapping.answerLanguageCode ?? ''
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    if (isAnswerLanguageMigrationError(err)) {
      return sendAnswerLanguageMigrationError(res);
    }
    console.error('Error updating stream-subject mapping:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Delete one mapped subject row
institutesRouter.delete('/me/stream-subjects/:id', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const mappingId = z.coerce.number().int().positive().parse(req.params.id);
    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const mapping = await prisma.instituteStreamSubject.findFirst({
      where: { id: mappingId, instituteId: user.institute.id }
    });
    if (!mapping) {
      return res.status(404).json({ error: 'MAPPING_NOT_FOUND' });
    }

    await prisma.instituteStreamSubject.delete({ where: { id: mappingId } });
    return res.json({ ok: true, deletedId: mappingId });
  } catch (err) {
    if (isAnswerLanguageMigrationError(err)) {
      return sendAnswerLanguageMigrationError(res);
    }
    console.error('Error deleting stream-subject mapping:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Get per-exam application capacities and remaining slots
institutesRouter.get('/me/exam-capacities', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const q = z.object({
      openOnly: z.coerce.boolean().optional()
    }).parse(req.query);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const exams = await getInstituteExamCapacityRows(user.institute.id, { openOnly: q.openOnly ?? false });
    return res.json({ ok: true, instituteId: user.institute.id, exams });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error fetching institute exam capacities:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Set total students allowed for a specific exam
institutesRouter.put('/me/exam-capacities/:examId', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  try {
    const examId = z.coerce.number().int().positive().parse(req.params.examId);
    const body = z.object({
      streamId: z.coerce.number().int().positive(),
      totalStudents: z.coerce.number().int().min(0).max(100000)
    }).parse(req.body);

    const user = await getInstituteUserWithInstitute(req.auth.userId);
    if (!user || !user.institute) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not associated with an institute' });
    }

    const [exam, stream, allStreams] = await Promise.all([
      prisma.exam.findUnique({ where: { id: examId }, include: { stream: true } }),
      prisma.stream.findUnique({ where: { id: body.streamId } }),
      prisma.stream.findMany({ orderBy: { name: 'asc' } })
    ]);
    if (!exam) {
      return res.status(404).json({ error: 'EXAM_NOT_FOUND' });
    }
    if (!stream) {
      return res.status(404).json({ error: 'STREAM_NOT_FOUND' });
    }

    const saved = await prisma.instituteExamCapacity.upsert({
      where: {
        instituteId_examId_streamId: {
          instituteId: user.institute.id,
          examId,
          streamId: body.streamId
        }
      },
      update: {
        totalStudents: body.totalStudents
      },
      create: {
        instituteId: user.institute.id,
        examId,
        streamId: body.streamId,
        totalStudents: body.totalStudents
      }
    });

    const applications = await prisma.examApplication.findMany({
      where: {
        instituteId: user.institute.id,
        examId
      },
      select: {
        student: {
          select: { streamCode: true }
        }
      }
    });

    const applicationsUsed = applications.reduce((count, app) => {
      const resolvedStreamId = resolveStreamIdFromValue(app.student?.streamCode, allStreams, exam.streamId ?? null);
      return resolvedStreamId === body.streamId ? count + 1 : count;
    }, 0);

    return res.json({
      ok: true,
      exam: {
        examId: exam.id,
        examName: exam.name,
        streamId: stream.id,
        streamName: stream.name ?? exam.stream?.name ?? '',
        totalStudents: saved.totalStudents,
        applicationsUsed,
        remainingApplications: Math.max(saved.totalStudents - applicationsUsed, 0),
        isCapacityReached: applicationsUsed >= saved.totalStudents
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    console.error('Error saving institute exam capacity:', err);
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

    // Check if the required institute fields used by the current UI are filled.
    const isProfileComplete = !![
      institute.address,
      institute.district,
      institute.taluka,
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
        centerNo: institute.code,
        collegeNo: institute.collegeNo,
        uniqueNo: institute.collegeNo,
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
      institute: toInstituteDetailsDto(institute)
    });
  } catch (err) {
    console.error('Error fetching institute details:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute admin: Update institute details
institutesRouter.patch('/me', requireAuth, requireRole(['INSTITUTE']), handleInstituteDetailsUpdate);
institutesRouter.put('/me', requireAuth, requireRole(['INSTITUTE']), handleInstituteDetailsUpdate);

