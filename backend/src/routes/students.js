import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth/middleware.js';
import { signAccessToken } from '../auth/tokens.js';
import { attachStudentAssets, removeStudentAsset, saveStudentAsset } from '../utils/student-assets.js';

export const studentsRouter = Router();

function normalizeStudentName(student) {
  const parts = [student?.lastName, student?.firstName, student?.middleName]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.join(' ').trim();
}

function profileCompletionForStudent(student) {
  const requiredFields = [
    student?.firstName,
    student?.lastName,
    student?.dob,
    student?.gender,
    student?.aadhaar,
    student?.address,
    student?.pinCode,
    student?.mobile
  ];

  const completed = requiredFields.filter((value) => value !== null && value !== undefined && String(value).trim() !== '').length;
  return Math.round((completed / requiredFields.length) * 100);
}

function studentSummaryDto(student) {
  return {
    id: student.id,
    userId: student.userId ?? null,
    managerUserId: student.managerUserId ?? null,
    instituteId: student.instituteId,
    instituteName: student.institute?.name || null,
    instituteCode: student.institute?.code || student.institute?.collegeNo || null,
    streamCode: student.streamCode || null,
    firstName: student.firstName || null,
    middleName: student.middleName || null,
    lastName: student.lastName || null,
    fullName: normalizeStudentName(student) || 'Unnamed Student',
    aadhaar: student.aadhaar || null,
    dob: student.dob || null,
    mobile: student.mobile || null,
    gender: student.gender || null,
    address: student.address || null,
    pinCode: student.pinCode || null,
    district: student.district || null,
    taluka: student.taluka || null,
    village: student.village || null,
    categoryCode: student.categoryCode || null,
    minorityReligionCode: student.minorityReligionCode || null,
    divyangCode: student.divyangCode || null,
    mediumCode: student.mediumCode || null,
    apaarId: student.apaarId || null,
    studentSaralId: student.studentSaralId || null,
    sscPassedFromMaharashtra: student.sscPassedFromMaharashtra ?? null,
    eligibilityCertIssued: student.eligibilityCertIssued ?? null,
    eligibilityCertNo: student.eligibilityCertNo || null,
    photoUrl: student.photoUrl || null,
    signatureUrl: student.signatureUrl || null,
    profileCompletion: profileCompletionForStudent(student),
    previousExams: student.previousExams || [],
    createdAt: student.createdAt
  };
}

async function getAccessibleStudents(userId) {
  return prisma.student.findMany({
    where: {
      OR: [
        { userId },
        { managerUserId: userId }
      ]
    },
    include: {
      institute: {
        select: {
          id: true,
          name: true,
          code: true,
          collegeNo: true
        }
      },
      previousExams: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  });
}

async function getAccessibleStudentById(userId, studentId) {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      OR: [
        { userId },
        { managerUserId: userId }
      ]
    },
    include: {
      institute: {
        select: {
          id: true,
          name: true,
          code: true,
          collegeNo: true
        }
      },
      previousExams: true
    }
  });
}

// Lookup student by Aadhaar number
studentsRouter.get('/lookup-by-aadhaar/:aadhaar', requireAuth, async (req, res) => {
  try {
    const { aadhaar } = req.params;
    
    // Validate Aadhaar format
    if (!/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({ 
        error: 'INVALID_AADHAAR', 
        message: 'Aadhaar must be 12 digits' 
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        aadhaar: aadhaar
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            code: true,
            collegeNo: true,
            district: true
          }
        },
        previousExams: true
      }
    });

    if (!student) {
      return res.json({ 
        found: false, 
        message: 'No student found with this Aadhaar number' 
      });
    }

    return res.json({ 
      found: true, 
      student: studentSummaryDto(student),
      fullStudent: student
    });
  } catch (err) {
    console.error('Aadhaar lookup error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

studentsRouter.get('/managed', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const students = await getAccessibleStudents(userId);
    const studentsWithAssets = await Promise.all(students.map((student) => attachStudentAssets(student)));
    return res.json({ students: studentsWithAssets.map(studentSummaryDto) });
  } catch (err) {
    console.error('Get managed students error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

studentsRouter.get('/managed/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const studentId = z.coerce.number().int().positive().parse(req.params.id);
    const student = await getAccessibleStudentById(userId, studentId);
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });

    const studentWithAssets = await attachStudentAssets(student);
    return res.json({ ok: true, student: studentWithAssets });
  } catch (err) {
    console.error('Get managed student by id error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

studentsRouter.post('/managed', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const body = z.object({
      instituteId: z.coerce.number().int().positive(),
      streamCode: z.string().min(1).max(20),
      firstName: z.string().min(1).max(100),
      middleName: z.string().max(100).optional(),
      lastName: z.string().min(1).max(100),
      motherName: z.string().max(100).optional(),
      dob: z.string().datetime().optional(),
      gender: z.string().max(20).optional(),
      mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
      aadhaar: z.string().regex(/^\d{12}$/),
      address: z.string().max(500).optional(),
      pinCode: z.string().max(10).optional(),
      district: z.string().max(100).optional(),
      taluka: z.string().max(100).optional(),
      village: z.string().max(100).optional(),
      categoryCode: z.string().max(10).optional(),
      minorityReligionCode: z.string().max(20).optional(),
      divyangCode: z.string().max(10).optional(),
      mediumCode: z.string().max(10).optional(),
      apaarId: z.string().max(20).optional(),
      studentSaralId: z.string().max(50).optional(),
      sscPassedFromMaharashtra: z.boolean().nullable().optional(),
      eligibilityCertIssued: z.boolean().nullable().optional(),
      eligibilityCertNo: z.string().max(100).nullable().optional(),
      photoDataUrl: z.string().min(40).optional(),
      signatureDataUrl: z.string().min(40).optional(),
      sscSeatNo: z.string().max(50).optional(),
      sscMonth: z.string().max(10).optional(),
      sscYear: z.coerce.number().int().positive().optional(),
      sscBoard: z.string().max(200).optional(),
      sscPercentage: z.string().max(10).optional(),
      xithSeatNo: z.string().max(50).optional(),
      xithMonth: z.string().max(10).optional(),
      xithYear: z.coerce.number().int().positive().optional(),
      xithCollege: z.string().max(200).optional(),
      xithPercentage: z.string().max(10).optional()
    }).parse(req.body ?? {});

    const institute = await prisma.institute.findUnique({ where: { id: body.instituteId } });
    if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

    const duplicateCandidates = [];
    if (body.aadhaar) duplicateCandidates.push({ aadhaar: body.aadhaar });
    if (body.mobile) duplicateCandidates.push({ mobile: body.mobile });
    duplicateCandidates.push({
      firstName: body.firstName,
      lastName: body.lastName,
      dob: body.dob ? new Date(body.dob) : null,
      instituteId: body.instituteId,
      streamCode: body.streamCode
    });

    const duplicateStudent = await prisma.student.findFirst({
      where: {
        managerUserId: userId,
        OR: duplicateCandidates
      }
    });
    if (duplicateStudent) {
      return res.status(409).json({
        error: 'DUPLICATE_STUDENT',
        message: 'A managed student with this identity already exists.',
        student: studentSummaryDto(duplicateStudent)
      });
    }

    const previousExams = [];
    if (body.sscSeatNo || body.sscMonth || body.sscYear || body.sscBoard || body.sscPercentage) {
      previousExams.push({
        examType: 'SSC',
        seatNo: body.sscSeatNo || null,
        month: body.sscMonth || null,
        year: body.sscYear || null,
        boardOrCollegeName: body.sscBoard || null,
        percentage: body.sscPercentage || null
      });
    }
    if (body.xithSeatNo || body.xithMonth || body.xithYear || body.xithCollege || body.xithPercentage) {
      previousExams.push({
        examType: 'XI',
        seatNo: body.xithSeatNo || null,
        month: body.xithMonth || null,
        year: body.xithYear || null,
        boardOrCollegeName: body.xithCollege || null,
        percentage: body.xithPercentage || null
      });
    }

    const student = await prisma.student.create({
      data: {
        instituteId: body.instituteId,
        managerUserId: userId,
        userId: null,
        streamCode: body.streamCode,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        motherName: body.motherName || null,
        dob: body.dob ? new Date(body.dob) : null,
        gender: body.gender || null,
        mobile: body.mobile || null,
        aadhaar: body.aadhaar || null,
        address: body.address || null,
        pinCode: body.pinCode || null,
        district: body.district || null,
        taluka: body.taluka || null,
        village: body.village || null,
        categoryCode: body.categoryCode || null,
        minorityReligionCode: body.minorityReligionCode || null,
        divyangCode: body.divyangCode || null,
        mediumCode: body.mediumCode || null,
        apaarId: body.apaarId ? body.apaarId.toUpperCase() : null,
        studentSaralId: body.studentSaralId ? body.studentSaralId.toUpperCase() : null,
        sscPassedFromMaharashtra: body.sscPassedFromMaharashtra ?? null,
        eligibilityCertIssued: body.eligibilityCertIssued ?? null,
        eligibilityCertNo:
          body.eligibilityCertIssued === true
            ? (body.eligibilityCertNo || null)
            : null,
        previousExams: previousExams.length > 0 ? { create: previousExams } : undefined
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            code: true,
            collegeNo: true
          }
        },
        previousExams: true
      }
    });

    if (body.photoDataUrl) {
      await saveStudentAsset(student.id, 'photo', body.photoDataUrl);
    }
    if (body.signatureDataUrl) {
      await saveStudentAsset(student.id, 'signature', body.signatureDataUrl);
    }

    const studentWithAssets = await attachStudentAssets(student);
    return res.status(201).json({ ok: true, student: studentWithAssets });
  } catch (err) {
    console.error('Create managed student error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

studentsRouter.patch('/managed/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const studentId = z.coerce.number().int().positive().parse(req.params.id);
    const student = await getAccessibleStudentById(userId, studentId);
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });

    // Compatibility: allow primary profile updates on managed endpoint for legacy clients.
    // Preferred endpoint for primary profile remains PATCH /students/me.

    const body = z.object({
      instituteId: z.coerce.number().int().positive().optional(),
      streamCode: z.string().min(1).max(20).optional(),
      firstName: z.string().min(1).max(100).optional(),
      middleName: z.string().max(100).nullable().optional(),
      lastName: z.string().min(1).max(100).optional(),
      motherName: z.string().max(100).nullable().optional(),
      dob: z.string().datetime().nullable().optional(),
      gender: z.string().max(20).nullable().optional(),
      mobile: z.string().regex(/^[6-9]\d{9}$/).nullable().optional(),
      aadhaar: z.string().regex(/^\d{12}$/).nullable().optional(),
      address: z.string().max(500).nullable().optional(),
      pinCode: z.string().max(10).nullable().optional(),
      district: z.string().max(100).nullable().optional(),
      taluka: z.string().max(100).nullable().optional(),
      village: z.string().max(100).nullable().optional(),
      categoryCode: z.string().max(10).nullable().optional(),
      minorityReligionCode: z.string().max(20).nullable().optional(),
      divyangCode: z.string().max(10).nullable().optional(),
      mediumCode: z.string().max(10).nullable().optional(),
      apaarId: z.string().max(20).nullable().optional(),
      studentSaralId: z.string().max(50).nullable().optional(),
      sscPassedFromMaharashtra: z.boolean().nullable().optional(),
      eligibilityCertIssued: z.boolean().nullable().optional(),
      eligibilityCertNo: z.string().max(100).nullable().optional(),
      photoDataUrl: z.string().min(40).nullable().optional(),
      signatureDataUrl: z.string().min(40).nullable().optional(),
      sscSeatNo: z.string().max(50).nullable().optional(),
      sscMonth: z.string().max(10).nullable().optional(),
      sscYear: z.coerce.number().int().positive().nullable().optional(),
      sscBoard: z.string().max(200).nullable().optional(),
      sscPercentage: z.string().max(10).nullable().optional(),
      xithSeatNo: z.string().max(50).nullable().optional(),
      xithMonth: z.string().max(10).nullable().optional(),
      xithYear: z.coerce.number().int().positive().nullable().optional(),
      xithCollege: z.string().max(200).nullable().optional(),
      xithPercentage: z.string().max(10).nullable().optional()
    }).parse(req.body ?? {});

    if (student.aadhaar && body.aadhaar !== undefined && body.aadhaar !== student.aadhaar) {
      return res.status(409).json({
        error: 'AADHAAR_LOCKED',
        message: 'Aadhaar cannot be changed once saved for this student.'
      });
    }

    if (!student.aadhaar) {
      const incomingAadhaar = typeof body.aadhaar === 'string' ? body.aadhaar.trim() : '';
      if (!incomingAadhaar) {
        return res.status(422).json({
          error: 'AADHAAR_REQUIRED',
          message: 'Aadhaar is mandatory for managed student profile.'
        });
      }
    }

    if (body.instituteId !== undefined) {
      const institute = await prisma.institute.findUnique({ where: { id: body.instituteId } });
      if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });
    }

    const previousExams = [];
    if (body.sscSeatNo || body.sscMonth || body.sscYear || body.sscBoard || body.sscPercentage) {
      previousExams.push({
        examType: 'SSC',
        seatNo: body.sscSeatNo || null,
        month: body.sscMonth || null,
        year: body.sscYear ?? null,
        boardOrCollegeName: body.sscBoard || null,
        percentage: body.sscPercentage || null
      });
    }
    if (body.xithSeatNo || body.xithMonth || body.xithYear || body.xithCollege || body.xithPercentage) {
      previousExams.push({
        examType: 'XI',
        seatNo: body.xithSeatNo || null,
        month: body.xithMonth || null,
        year: body.xithYear ?? null,
        boardOrCollegeName: body.xithCollege || null,
        percentage: body.xithPercentage || null
      });
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        instituteId: body.instituteId ?? undefined,
        streamCode: body.streamCode ?? undefined,
        firstName: body.firstName ?? undefined,
        middleName: body.middleName ?? undefined,
        lastName: body.lastName ?? undefined,
        motherName: body.motherName ?? undefined,
        dob: body.dob ? new Date(body.dob) : (body.dob === null ? null : undefined),
        gender: body.gender ?? undefined,
        mobile: body.mobile ?? undefined,
        aadhaar: body.aadhaar ?? undefined,
        address: body.address ?? undefined,
        pinCode: body.pinCode ?? undefined,
        district: body.district ?? undefined,
        taluka: body.taluka ?? undefined,
        village: body.village ?? undefined,
        categoryCode: body.categoryCode ?? undefined,
        minorityReligionCode: body.minorityReligionCode ?? undefined,
        divyangCode: body.divyangCode ?? undefined,
        mediumCode: body.mediumCode ?? undefined,
        apaarId: body.apaarId ? body.apaarId.toUpperCase() : (body.apaarId === null ? null : undefined),
        studentSaralId: body.studentSaralId ? body.studentSaralId.toUpperCase() : (body.studentSaralId === null ? null : undefined),
        sscPassedFromMaharashtra: body.sscPassedFromMaharashtra ?? undefined,
        eligibilityCertIssued: body.eligibilityCertIssued ?? undefined,
        eligibilityCertNo:
          body.eligibilityCertIssued === true
            ? (body.eligibilityCertNo ?? undefined)
            : (body.eligibilityCertIssued === false ? null : undefined),
        previousExams: previousExams.length > 0 ? {
          deleteMany: { examType: { in: ['SSC', 'XI'] } },
          create: previousExams
        } : undefined
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            code: true,
            collegeNo: true
          }
        },
        previousExams: true
      }
    });

    if (body.photoDataUrl !== undefined) {
      if (body.photoDataUrl) {
        await saveStudentAsset(updated.id, 'photo', body.photoDataUrl);
      } else {
        await removeStudentAsset(updated.id, 'photo');
      }
    }

    if (body.signatureDataUrl !== undefined) {
      if (body.signatureDataUrl) {
        await saveStudentAsset(updated.id, 'signature', body.signatureDataUrl);
      } else {
        await removeStudentAsset(updated.id, 'signature');
      }
    }

    const updatedWithAssets = await attachStudentAssets(updated);
    return res.json({ ok: true, student: updatedWithAssets });
  } catch (err) {
    console.error('Update managed student error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Check student onboarding status - required before accessing dashboard
studentsRouter.get('/setup-status', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    // Check if student profile exists (institute selected)
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        instituteId: true,
        streamCode: true,
        firstName: true,
        lastName: true,
        motherName: true,
        institute: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        }
      }
    });

    // Determine profile completion
    const profileComplete = student ? (
      student.firstName && 
      student.lastName && 
      student.motherName
    ) : false;

    return res.json({
      instituteSelected: !!student,
      profileComplete: profileComplete,
      student: student ? {
        id: student.id,
        institueId: student.instituteId,
        streamCode: student.streamCode,
        institute: student.institute
      } : null,
      onboardingSteps: {
        step1_instituteSelected: !!student,
        step2_profileComplete: profileComplete,
        allowDashboardAccess: !!student && profileComplete
      }
    });
  } catch (err) {
    console.error('Get setup status error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Get current student profile
studentsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        applications: true,
        previousExams: true,
        feeReimbursement: true
      }
    });

    if (!student) {
      // Student profile not yet created - return 404 with specific error
      return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING', message: 'Please complete your profile first' });
    }

    const studentWithAssets = await attachStudentAssets(student);
    return res.json({ student: studentWithAssets });
  } catch (err) {
    console.error('Get student profile error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Update current student profile (PATCH /students/me)
studentsRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });
    }

    // Validation schema - allow both omitted and null values for optional fields
    const updateSchema = z.object({
      firstName: z.string().min(2).max(50).nullable().optional(),
      middleName: z.string().max(50).nullable().optional(),
      lastName: z.string().min(2).max(50).nullable().optional(),
      motherName: z.string().min(2).max(50).nullable().optional(),
      dob: z.string().datetime().nullable().optional(),
      gender: z.string().nullable().optional(),
      aadhaar: z.string().nullable().optional(),
      apaarId: z.string().max(20).nullable().optional(),
      studentSaralId: z.string().max(50).nullable().optional(),
      email: z.string().email().nullable().optional(),
      address: z.string().nullable().optional(),
      district: z.string().max(100).nullable().optional(),
      taluka: z.string().max(100).nullable().optional(),
      village: z.string().max(100).nullable().optional(),
      pinCode: z.string().nullable().optional(),
      mobile: z.string().regex(/^[6-9]\d{9}$/).nullable().optional(),
      streamCode: z.string().nullable().optional(),
      minorityReligionCode: z.string().nullable().optional(),
      categoryCode: z.string().nullable().optional(),
      divyangCode: z.string().nullable().optional(),
      mediumCode: z.string().nullable().optional(),
      sscPassedFromMaharashtra: z.boolean().nullable().optional(),
      eligibilityCertIssued: z.boolean().nullable().optional(),
      eligibilityCertNo: z.string().max(100).nullable().optional()
    });

    const data = updateSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const userData = {};
      if (data.email !== undefined) userData.email = data.email || null;
      if (data.mobile !== undefined) userData.mobile = data.mobile || null;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData
        });
      }

      return tx.student.update({
        where: { id: student.id },
        data: {
          firstName: data.firstName ?? undefined,
          middleName: data.middleName ?? undefined,
          lastName: data.lastName ?? undefined,
          motherName: data.motherName ?? undefined,
          dob: data.dob ? new Date(data.dob) : undefined,
          gender: data.gender ?? undefined,
          aadhaar: data.aadhaar ?? undefined,
          apaarId: data.apaarId ? data.apaarId.toUpperCase() : undefined,
          studentSaralId: data.studentSaralId ? data.studentSaralId.toUpperCase() : undefined,
          address: data.address ?? undefined,
          district: data.district ?? undefined,
          taluka: data.taluka ?? undefined,
          village: data.village ?? undefined,
          pinCode: data.pinCode ?? undefined,
          mobile: data.mobile ?? undefined,
          streamCode: data.streamCode ?? undefined,
          minorityReligionCode: data.minorityReligionCode ?? undefined,
          categoryCode: data.categoryCode ?? undefined,
          divyangCode: data.divyangCode ?? undefined,
          mediumCode: data.mediumCode ?? undefined,
          sscPassedFromMaharashtra: data.sscPassedFromMaharashtra ?? undefined,
          eligibilityCertIssued: data.eligibilityCertIssued ?? undefined,
          eligibilityCertNo:
            data.eligibilityCertIssued === true
              ? (data.eligibilityCertNo ?? undefined)
              : (data.eligibilityCertIssued === false ? null : undefined)
        }
      });
    });

    const studentWithAssets = await attachStudentAssets(updated);
    return res.json({ ok: true, student: studentWithAssets });
  } catch (err) {
    console.error('Update student profile error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

studentsRouter.post('/me/assets/:type', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { type } = z.object({ type: z.enum(['photo', 'signature']) }).parse(req.params);
    const { dataUrl } = z.object({ dataUrl: z.string().min(40) }).parse(req.body ?? {});

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });

    const saved = await saveStudentAsset(student.id, type, dataUrl);
    const studentWithAssets = await attachStudentAssets(student);

    return res.json({
      ok: true,
      type,
      url: saved.url,
      sizeKB: Number((saved.bytes / 1024).toFixed(1)),
      student: studentWithAssets
    });
  } catch (err) {
    console.error('Upload student asset error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(err.status || 500).json({ error: err.message || 'UPLOAD_FAILED', message: err.message || 'Unable to upload image' });
  }
});

studentsRouter.delete('/me/assets/:type', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { type } = z.object({ type: z.enum(['photo', 'signature']) }).parse(req.params);
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });

    await removeStudentAsset(student.id, type);
    const studentWithAssets = await attachStudentAssets(student);
    return res.json({ ok: true, student: studentWithAssets });
  } catch (err) {
    console.error('Remove student asset error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(err.status || 500).json({ error: err.message || 'REMOVE_FAILED', message: err.message || 'Unable to remove image' });
  }
});

// Update student profile (PATCH)
studentsRouter.patch('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = z.coerce.number().int().positive().parse(req.params.id);
    
    // Verify ownership - student can only update their own profile
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    if (student.userId !== req.auth?.userId) return res.status(403).json({ error: 'FORBIDDEN' });

    // Comprehensive validation schema
    const body = z.object({
      // Personal Details
      firstName: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      lastName: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      middleName: z.string()
        .max(50, 'Middle name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]*$/, 'Middle name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      motherName: z.string()
        .min(2, 'Mother name must be at least 2 characters')
        .max(50, 'Mother name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Mother name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      // Contact Information
      email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must not exceed 100 characters')
        .optional(),
      
      mobile: z.string()
        .regex(/^[6-9]\d{9}$/, 'Mobile number must be 10 digits and start with 6-9')
        .optional(),
      
      // Identification
      aadharNumber: z.string()
        .regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits')
        .optional(),
      
      // Date of Birth
      dateOfBirth: z.string()
        .refine(
          (val) => {
            if (!val) return true;
            const dob = new Date(val);
            const today = new Date();
            // Check if date is valid
            if (isNaN(dob.getTime())) return false;
            // Check if date is in the future
            if (dob > today) return false;
            // Check minimum age (14 years)
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              return age - 1 >= 14;
            }
            return age >= 14;
          },
          'Date of birth must be valid, not in future, and at least 14 years old'
        )
        .optional(),
      
      // Demographics
      gender: z.enum(['Male', 'Female', 'Other'], {
        errorMap: () => ({ message: 'Gender must be Male, Female, or Other' })
      }).optional(),
      
      // Address Information
      addressLineOne: z.string()
        .min(3, 'Address line 1 must be at least 3 characters')
        .max(100, 'Address line 1 must not exceed 100 characters')
        .optional(),
      
      addressLineTwo: z.string()
        .max(100, 'Address line 2 must not exceed 100 characters')
        .optional(),
      
      addressLineThree: z.string()
        .max(100, 'Address line 3 must not exceed 100 characters')
        .optional(),
      
      pincode: z.string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
        .optional(),
      
      district: z.string()
        .min(2, 'District must be at least 2 characters')
        .max(50, 'District must not exceed 50 characters')
        .optional(),
      
      taluka: z.string()
        .min(2, 'Taluka must be at least 2 characters')
        .max(50, 'Taluka must not exceed 50 characters')
        .optional(),
      
      village: z.string()
        .min(1, 'Village must not be empty')
        .max(50, 'Village must not exceed 50 characters')
        .optional(),
      
      revenueCircle: z.string()
        .max(50, 'Revenue circle must not exceed 50 characters')
        .optional(),
      
      // Academic Information
      streamCode: z.string().optional(),
      categoryCode: z.string().optional(),
      divyangCode: z.string().optional(),
      mediumCode: z.string().optional(),
      minorityReligionCode: z.string().optional(),
      
      // Legacy fields (keep for backwards compatibility)
      instituteId: z.coerce.number().int().positive().optional(),
      rollNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      collegeName: z.string().optional(),
      collegeBranch: z.string().optional(),
      admissionYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
      stream: z.string().optional(),
      board: z.string().optional()
    }).parse(req.body);

    // Validate instituteId if provided
    if (body.instituteId) {
      const institute = await prisma.institute.findUnique({
        where: { id: body.instituteId }
      });
      if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        middleName: body.middleName || undefined,
        motherName: body.motherName || undefined,
        email: body.email || undefined,
        mobile: body.mobile || undefined,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender || undefined,
        aadharNumber: body.aadharNumber || undefined,
        rollNumber: body.rollNumber || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        state: body.state || undefined,
        pincode: body.pincode || undefined,
        instituteId: body.instituteId || undefined,
        collegeName: body.collegeName || undefined,
        collegeBranch: body.collegeBranch || undefined,
        admissionYear: body.admissionYear || undefined,
        stream: body.stream || undefined,
        board: body.board || undefined,
        streamCode: body.streamCode || undefined,
        categoryCode: body.categoryCode || undefined,
        divyangCode: body.divyangCode || undefined,
        mediumCode: body.mediumCode || undefined,
        minorityReligionCode: body.minorityReligionCode || undefined
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({ 
      ok: true, 
      student: updatedStudent 
    });
  } catch (err) {
    console.error('Update student profile error:', err);
    
    // Return validation errors from Zod
    if (err.name === 'ZodError') {
      return res.status(422).json({
        error: 'VALIDATION_ERROR',
        issues: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PATCH /students/me/previous-exams - Update previous exam records
studentsRouter.patch('/me/previous-exams', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    // Validation schema for previous exams - coerce numbers to strings
    const updateSchema = z.object({
      sscSeatNo: z.string().nullable().optional(),
      sscMonth: z.string().nullable().optional(),
      sscYear: z.coerce.string().nullable().optional(),
      sscBoard: z.string().nullable().optional(),
      sscPercentage: z.coerce.string().nullable().optional(),
      xithSeatNo: z.string().nullable().optional(),
      xithMonth: z.string().nullable().optional(),
      xithYear: z.coerce.string().nullable().optional(),
      xithCollege: z.string().nullable().optional(),
      xithPercentage: z.coerce.string().nullable().optional()
    });

    const data = updateSchema.parse(req.body);

    // Delete existing previous exam records
    await prisma.previousExam.deleteMany({
      where: { studentId: student.id }
    });

    // Create new previous exam records if data is provided
    const createdExams = [];

    // SSC exam record
    if (data.sscSeatNo || data.sscMonth || data.sscYear || data.sscBoard || data.sscPercentage) {
      const sscExam = await prisma.previousExam.create({
        data: {
          studentId: student.id,
          examType: 'SSC',
          seatNo: data.sscSeatNo || null,
          month: data.sscMonth || null,
          year: data.sscYear ? parseInt(data.sscYear) : null,
          percentage: data.sscPercentage || null,
          boardOrCollegeName: data.sscBoard || null
        }
      });
      createdExams.push(sscExam);
    }

    // XIth exam record
    if (data.xithSeatNo || data.xithMonth || data.xithYear || data.xithCollege || data.xithPercentage) {
      const xithExam = await prisma.previousExam.create({
        data: {
          studentId: student.id,
          examType: 'XI',
          seatNo: data.xithSeatNo || null,
          month: data.xithMonth || null,
          year: data.xithYear ? parseInt(data.xithYear) : null,
          percentage: data.xithPercentage || null,
          boardOrCollegeName: data.xithCollege || null
        }
      });
      createdExams.push(xithExam);
    }

    return res.json({ 
      ok: true, 
      previousExams: createdExams,
      message: 'Previous exams saved successfully'
    });
  } catch (err) {
    console.error('Update previous exams error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PATCH /students/me/bank-details - Update bank details
studentsRouter.patch('/me/bank-details', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    // Validation schema for bank details
    const updateSchema = z.object({
      accountHolder: z.string().nullable().optional(),
      accountHolderRelation: z.string().nullable().optional(),
      ifscCode: z.string().nullable().optional(),
      accountNumber: z.string().nullable().optional()
    });

    const data = updateSchema.parse(req.body);
    const normalizedIfsc = data.ifscCode ? data.ifscCode.toUpperCase() : null;

    // Get or create fee reimbursement record
    let bankDetails = await prisma.feeReimbursement.findUnique({
      where: { studentId: student.id }
    });

    if (!bankDetails) {
      bankDetails = await prisma.feeReimbursement.create({
        data: {
          studentId: student.id,
          accountHolder: data.accountHolder || null,
          accountHolderRelation: data.accountHolderRelation || null,
          ifscCode: normalizedIfsc,
          accountNo: data.accountNumber || null,
          revenueCircleAndVillage: null
        }
      });
    } else {
      bankDetails = await prisma.feeReimbursement.update({
        where: { id: bankDetails.id },
        data: {
          accountHolder: data.accountHolder || null,
          accountHolderRelation: data.accountHolderRelation || null,
          ifscCode: normalizedIfsc,
          accountNo: data.accountNumber || null
        }
      });
    }

    return res.json({
      ok: true,
      bankDetails: {
        ...bankDetails,
        accountNumber: bankDetails.accountNo ?? null
      },
      message: 'Bank details saved successfully'
    });
  } catch (err) {
    console.error('Update bank details error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// POST: Student selects institute and stream right after Google login
studentsRouter.post('/select-institute', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const body = z.object({
      instituteId: z.coerce.number().int().positive(),
      streamCode: z.string().min(1).max(10) // e.g., 'Science', 'Arts', 'Commerce'
    }).parse(req.body);

    // Verify institute exists
    const institute = await prisma.institute.findUnique({
      where: { id: body.instituteId }
    });
    if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

    // Get the student profile for this user
    let student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      // First time - student profile doesn't exist yet, create it
      student = await prisma.student.create({
        data: {
          userId,
          instituteId: body.instituteId,
          streamCode: body.streamCode,
          firstName: '',
          lastName: ''
        }
      });
    } else {
      // Allow changing institute and stream - just update the existing record
      student = await prisma.student.update({
        where: { userId },
        data: {
          instituteId: body.instituteId,
          streamCode: body.streamCode
        }
      });
    }

    return res.json({
      ok: true,
      message: 'Institute and Stream selected successfully',
      // Return updated access token with correct instituteId
      accessToken: signAccessToken({
        userId,
        role: 'STUDENT',
        instituteId: student.instituteId,
        username: req.auth.username
      }),
      student: {
        id: student.id,
        userId: student.userId,
        instituteId: student.instituteId,
        streamCode: student.streamCode,
        firstName: student.firstName,
        lastName: student.lastName
      }
    });
  } catch (err) {
    console.error('Select institute error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});