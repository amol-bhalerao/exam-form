import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { env } from '../env.js';
import { attachStudentAssets } from '../utils/student-assets.js';

const STUDENT_STREAM_CODE_LOOKUP = {
  '1': 'Science',
  '2': 'Arts',
  '3': 'Commerce',
  '4': 'Vocational',
  '5': 'Technology'
};

function resolveStreamIdFromStudentCode(streamCode, streams = [], fallbackStreamId = null) {
  if (streamCode === undefined || streamCode === null || streamCode === '') return fallbackStreamId;

  const normalized = String(streamCode).trim().toLowerCase();
  const requested = String(STUDENT_STREAM_CODE_LOOKUP[normalized] || normalized).toLowerCase();
  const matched = streams.find((stream) => {
    const name = String(stream?.name || '').toLowerCase();
    return name === requested || name.includes(requested) || requested.includes(name);
  });

  return matched?.id ?? fallbackStreamId;
}

export const applicationsRouter = Router();

function now() {
  return new Date();
}

function asText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function fullStudentName(student = {}) {
  return [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ').trim();
}

function toBoardStudentMasterRow(application) {
  const subjectItems = (application.subjects || []).map((entry) => entry.subject).filter(Boolean);
  const subjectCodes = subjectItems.map((subject) => subject.code).filter(Boolean).join(', ');
  const subjectNames = subjectItems.map((subject) => subject.name).filter(Boolean).join(', ');
  const subjectCategories = Array.from(new Set(subjectItems.map((subject) => subject.category).filter(Boolean))).join(', ');

  return {
    applicationId: application.id,
    applicationNo: application.applicationNo || '',
    status: application.status || '',
    candidateType: application.candidateType || '',
    examId: application.exam?.id ?? null,
    examName: application.exam?.name || '',
    examSession: application.exam?.session || '',
    examAcademicYear: application.exam?.academicYear || '',
    instituteId: application.institute?.id ?? null,
    instituteCode: application.institute?.code || application.institute?.collegeNo || '',
    instituteName: application.institute?.name || '',
    instituteDistrict: application.institute?.district || '',
    studentId: application.student?.id ?? null,
    studentName: fullStudentName(application.student),
    firstName: asText(application.student?.firstName),
    middleName: asText(application.student?.middleName),
    lastName: asText(application.student?.lastName),
    motherName: asText(application.student?.motherName),
    dob: application.student?.dob || null,
    gender: asText(application.student?.gender),
    aadhaar: asText(application.student?.aadhaar),
    apaarId: asText(application.student?.apaarId),
    studentSaralId: asText(application.student?.studentSaralId || application.studentSaralId),
    mobile: asText(application.student?.mobile),
    streamCode: asText(application.student?.streamCode),
    categoryCode: asText(application.student?.categoryCode),
    minorityReligionCode: asText(application.student?.minorityReligionCode),
    mediumCode: asText(application.student?.mediumCode),
    divyangCode: asText(application.student?.divyangCode),
    address: asText(application.student?.address),
    district: asText(application.student?.district),
    taluka: asText(application.student?.taluka),
    village: asText(application.student?.village),
    pinCode: asText(application.student?.pinCode),
    subjectCodes,
    subjectNames,
    subjectCategories,
    subjectCount: subjectItems.length,
    submittedAt: application.submittedAt || null,
    updatedAt: application.updatedAt || null
  };
}

function topGroupedCounts(values = [], limit = 10) {
  const grouped = new Map();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key) continue;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return [...grouped.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

async function addStatusHistory(params) {
  await prisma.statusHistory.create({
    data: {
      applicationId: params.applicationId,
      actorUserId: params.actorUserId,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus,
      remark: params.remark
    }
  });
}

async function getApplicationScoped(applicationId, auth) {
  const app = await prisma.examApplication.findUnique({
    where: { id: applicationId },
    include: {
      exam: { include: { stream: true } },
      institute: true,
      student: true,
      subjects: { include: { subject: true } },
      exemptedSubjects: true,
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 25 }
    }
  });
  if (!app) return null;

  if (app.student) {
    app.student = await attachStudentAssets(app.student);
  }

  if (auth.role === 'SUPER_ADMIN') return app;

  if (auth.role === 'BOARD') {
    if (
      app.status === 'SUBMITTED' ||
      app.status === 'INSTITUTE_VERIFIED' ||
      app.status === 'BOARD_APPROVED' ||
      app.status === 'REJECTED_BY_INSTITUTE' ||
      app.status === 'REJECTED_BY_BOARD'
    ) return app;
    return null;
  }

  if (auth.role === 'INSTITUTE') {
    if (!auth.instituteId || auth.instituteId !== app.instituteId) return null;
    return app;
  }

  if (auth.role === 'STUDENT') {
    const student = await prisma.student.findFirst({ where: { id: app.studentId, userId: auth.userId } });
    if (!student) return null;
    return app;
  }

  return null;
}

// Student: list my applications
applicationsRouter.get('/my', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  try {
    let student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    
    // If profile doesn't exist yet, it means student hasn't selected institute yet
    if (!student) {
      // Return helpful error directing them to complete profile
      return res.status(412).json({ 
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile by selecting your institute and stream first.',
        redirectUrl: '/student/select-institute'
      });
    }

    const apps = await prisma.examApplication.findMany({
      where: { studentId: student.id },
      include: { exam: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    return res.json({ applications: apps });
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Student: create application for an exam
applicationsRouter.post('/', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const body = z
      .object({
        examId: z.number().int().positive(),
        candidateType: z.enum(['REGULAR', 'REPEATER', 'ATKT', 'BACKLOG', 'IMPROVEMENT', 'PRIVATE'])
      })
      .parse(req.body);

    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student) {
      return res.status(412).json({ 
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile by selecting your institute and stream first.',
        redirectUrl: '/student/select-institute'
      });
    }

    const exam = await prisma.exam.findUnique({ where: { id: body.examId } });
    if (!exam) return res.status(404).json({ error: 'EXAM_NOT_FOUND' });

    const institute = await prisma.institute.findUnique({ where: { id: student.instituteId } });
    if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

    const streams = await prisma.stream.findMany({ orderBy: { name: 'asc' } });
    const studentStreamId = resolveStreamIdFromStudentCode(student.streamCode, streams, exam.streamId ?? null);

    const examCapacity = studentStreamId
      ? await prisma.instituteExamCapacity.findUnique({
          where: {
            instituteId_examId_streamId: {
              instituteId: student.instituteId,
              examId: exam.id,
              streamId: studentStreamId
            }
          }
        })
      : null;

    const applications = await prisma.examApplication.findMany({
      where: {
        instituteId: student.instituteId,
        examId: exam.id
      },
      select: {
        student: {
          select: { streamCode: true }
        }
      }
    });

    const applicationsUsed = studentStreamId
      ? applications.reduce((count, app) => {
          const appStreamId = resolveStreamIdFromStudentCode(app.student?.streamCode, streams, exam.streamId ?? null);
          return appStreamId === studentStreamId ? count + 1 : count;
        }, 0)
      : applications.length;

    const totalStudentsAllowed = examCapacity?.totalStudents ?? institute.examApplicationLimit ?? null;

    if (typeof totalStudentsAllowed === 'number' && applicationsUsed >= totalStudentsAllowed) {
      return res.status(409).json({
        error: 'EXAM_APPLICATION_LIMIT_REACHED',
        message: 'No remaining application slots are available for this exam at your institute.',
        totalStudents: totalStudentsAllowed,
        applicationsUsed,
        remainingApplications: 0
      });
    }

    const generatedApplicationNo = `APP-${Date.now()}`;
    const app = await prisma.examApplication.create({
      data: {
        instituteId: student.instituteId,
        studentId: student.id,
        examId: exam.id,
        applicationNo: generatedApplicationNo,
        applSrNo: generatedApplicationNo,
        studentSaralId: student.studentSaralId ?? null,
        candidateType: body.candidateType,
        status: 'DRAFT'
      }
    });

    await addStatusHistory({
      applicationId: app.id,
      actorUserId: req.auth.userId,
      fromStatus: null,
      toStatus: 'DRAFT'
    });

    return res.json({
      application: app,
      capacity: {
        totalStudents: totalStudentsAllowed,
        applicationsUsed: applicationsUsed + 1,
        remainingApplications: typeof totalStudentsAllowed === 'number'
          ? Math.max(totalStudentsAllowed - (applicationsUsed + 1), 0)
          : null,
        streamId: studentStreamId
      }
    });
  } catch (err) {
    console.error('Create application error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Get application (scoped by role/tenant)
applicationsRouter.get('/:id', requireAuth, async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.id);
  const app = await getApplicationScoped(applicationId, req.auth);
  if (!app) return res.status(404).json({ error: 'NOT_FOUND' });
  return res.json({ application: app });
});

// Student: update DRAFT application fields + subject selections
applicationsRouter.put('/:id', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const applicationId = z.coerce.number().int().positive().parse(req.params.id);

    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student) {
      return res.status(412).json({ 
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile by selecting your institute and stream first.',
        redirectUrl: '/student/select-institute'
      });
    }

    const app = await prisma.examApplication.findFirst({ where: { id: applicationId, studentId: student.id } });
    if (!app) return res.status(404).json({ error: 'NOT_FOUND' });
    if (app.status !== 'DRAFT') return res.status(400).json({ error: 'NOT_EDITABLE' });

  const body = z
    .object({
      // exam_applications
      candidateType: z.enum(['REGULAR', 'REPEATER', 'ATKT', 'BACKLOG', 'IMPROVEMENT', 'PRIVATE']).optional(),
      indexNo: z.string().optional(),
      udiseNo: z.string().optional(),
      studentSaralId: z.string().optional(),
      applSrNo: z.string().optional(),
      centreNo: z.string().optional(),
      typeA: z.string().optional(),
      typeB: z.string().optional(),
      typeC: z.string().optional(),
      typeD: z.string().optional(),
      isForeigner: z.boolean().optional(),
      totalExemptionsClaimed: z.number().int().min(0).max(9).optional(),
      enrollmentCertMonth: z.string().optional(),
      enrollmentCertYear: z.number().int().min(1990).max(2100).optional(),
      enrollmentNo: z.string().optional(),
      lastExamMonth: z.string().optional(),
      lastExamYear: z.number().int().min(1990).max(2100).optional(),
      lastExamSeatNo: z.string().optional(),
      sscPassedFromMaharashtra: z.boolean().optional(),
      eligibilityCertIssued: z.boolean().optional(),
      eligibilityCertNo: z.string().optional(),

      // student profile
      student: z
        .object({
          firstName: z.string().optional(),
          middleName: z.string().optional(),
          lastName: z.string().optional(),
          motherName: z.string().optional(),
          dob: z.string().datetime().optional(),
          gender: z.string().optional(),
          aadhaar: z.string().optional(),
          studentSaralId: z.string().optional(),
          address: z.string().optional(),
          pinCode: z.string().optional(),
          mobile: z.string().optional(),
          streamCode: z.string().optional(),
          minorityReligionCode: z.string().optional(),
          categoryCode: z.string().optional(),
          divyangCode: z.string().optional(),
          mediumCode: z.string().optional()
        })
        .optional(),

      subjects: z
        .array(
          z.object({
            subjectId: z.number().int().positive(),
            langOfAnsCode: z.string().optional(),
            isExemptedClaim: z.boolean().optional()
          })
        )
        .optional(),

      exemptedSubjects: z
        .array(
          z.object({
            subjectName: z.string().optional(),
            subjectCode: z.string().optional(),
            seatNo: z.string().optional(),
            month: z.string().optional(),
            year: z.number().int().min(1990).max(2100).optional(),
            marksObt: z.string().optional()
          })
        )
        .optional()
    })
    .parse(req.body);

  const exam = await prisma.exam.findUnique({ where: { id: app.examId } });
  if (!exam) return res.status(404).json({ error: 'EXAM_NOT_FOUND' });

  const institute = await prisma.institute.findUnique({ where: { id: student.instituteId } });
  if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

  if (body.subjects && body.subjects.length > 0) {
    const subjectIds = body.subjects.map((s) => s.subjectId);
    const instituteMappedSubjects = await prisma.instituteStreamSubject.findMany({
      where: { instituteId: student.instituteId, streamId: exam.streamId, subjectId: { in: subjectIds } },
      include: { subject: true }
    });

    const hasInstituteSpecificMappings = await prisma.instituteStreamSubject.count({
      where: { instituteId: student.instituteId, streamId: exam.streamId }
    });
    const hasBaseStreamMappings = await prisma.streamSubject.count({
      where: { streamId: exam.streamId }
    });

    const validStream = hasInstituteSpecificMappings > 0
      ? instituteMappedSubjects
      : hasBaseStreamMappings > 0
        ? await prisma.streamSubject.findMany({
            where: { streamId: exam.streamId, subjectId: { in: subjectIds } },
            include: { subject: true }
          })
        : (await prisma.subject.findMany({
            where: { id: { in: subjectIds } }
          })).map((subject) => ({ subject }));

    if (validStream.length !== subjectIds.length) {
      return res.status(400).json({
        error: 'INVALID_SUBJECT_SELECTION',
        message: hasInstituteSpecificMappings > 0
          ? 'Selected subject is not mapped for this institute and stream.'
          : 'Selected subject is not available for this stream.'
      });
    }

    // Draft save is allowed even when the final Language/Compulsory combination is not complete yet.
    // The final category mix is validated again at submit time.
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.student) {
      await tx.student.update({
        where: { id: student.id },
        data: {
          ...body.student,
          studentSaralId: body.student.studentSaralId ? body.student.studentSaralId.toUpperCase() : undefined,
          dob: body.student.dob ? new Date(body.student.dob) : undefined
        }
      });
    }

    if (body.subjects) {
      await tx.examApplicationSubject.deleteMany({ where: { applicationId } });
      if (body.subjects.length) {
        await tx.examApplicationSubject.createMany({
          data: body.subjects.map((s) => ({
            applicationId,
            subjectId: s.subjectId,
            langOfAnsCode: s.langOfAnsCode,
            isExemptedClaim: s.isExemptedClaim ?? false
          }))
        });
      }
    }

    if (body.exemptedSubjects) {
      await tx.exemptedSubjectInfo.deleteMany({ where: { applicationId } });
      if (body.exemptedSubjects.length) {
        await tx.exemptedSubjectInfo.createMany({
          data: body.exemptedSubjects.map((e) => ({
            applicationId,
            subjectName: e.subjectName,
            subjectCode: e.subjectCode,
            seatNo: e.seatNo,
            month: e.month,
            year: e.year,
            marksObt: e.marksObt
          }))
        });
      }
    }

    const app2 = await tx.examApplication.update({
      where: { id: applicationId },
      data: {
        candidateType: body.candidateType,
        indexNo: body.indexNo,
        udiseNo: body.udiseNo,
        studentSaralId: body.studentSaralId ?? body.student?.studentSaralId ?? app.studentSaralId ?? student.studentSaralId ?? app.applicationNo,
        applSrNo: body.applSrNo ?? app.applSrNo ?? app.applicationNo,
        centreNo: body.centreNo,
        typeA: body.typeA,
        typeB: body.typeB,
        typeC: body.typeC,
        typeD: body.typeD,
        isForeigner: body.isForeigner,
        totalExemptionsClaimed: body.totalExemptionsClaimed,
        enrollmentCertMonth: body.enrollmentCertMonth,
        enrollmentCertYear: body.enrollmentCertYear,
        enrollmentNo: body.enrollmentNo,
        lastExamMonth: body.lastExamMonth,
        lastExamYear: body.lastExamYear,
        lastExamSeatNo: body.lastExamSeatNo,
        sscPassedFromMaharashtra: body.sscPassedFromMaharashtra,
        eligibilityCertIssued: body.eligibilityCertIssued,
        eligibilityCertNo: body.eligibilityCertNo
      }
    });
    return app2;
  });

  return res.json({ application: updated });
  } catch (err) {
    console.error('Update application error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Student: submit (DRAFT -> SUBMITTED)
applicationsRouter.post('/:id/submit', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const applicationId = z.coerce.number().int().positive().parse(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student) {
      return res.status(412).json({ 
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile by selecting your institute and stream first.',
        redirectUrl: '/student/select-institute'
      });
    }

  const app = await prisma.examApplication.findFirst({
    where: { id: applicationId, studentId: student.id },
    include: {
      subjects: { include: { subject: true } }
    }
  });
  if (!app) return res.status(404).json({ error: 'NOT_FOUND' });
  if (app.status !== 'DRAFT') return res.status(400).json({ error: 'INVALID_STATE' });

  if (!app.subjects?.length) {
    return res.status(400).json({
      error: 'SUBJECTS_REQUIRED',
      message: 'Please select at least one subject before submitting the application.'
    });
  }

  const isBacklogStyleCandidate = ['BACKLOG', 'ATKT', 'REPEATER', 'IMPROVEMENT'].includes(app.candidateType);
  if (!isBacklogStyleCandidate) {
    const selectedCategories = [...new Set(
      app.subjects
        .map((entry) => String(entry.subject?.category || '').trim().toLowerCase())
        .filter(Boolean)
    )];
    const hasLanguage = selectedCategories.some((category) => category === 'language' || category.includes('lang'));
    const hasCompulsory = selectedCategories.some((category) => category === 'compulsory' || category.includes('compulsory'));

    if (!hasLanguage || !hasCompulsory) {
      return res.status(400).json({
        error: 'INVALID_SUBJECT_CATEGORY',
        message: 'Please select at least one language and one compulsory subject before submitting.',
        selectedCategories
      });
    }
  }

  if (Number(env.EXAM_FEE_PAISE ?? 0) > 0) {
    const latestPayment = await prisma.payment.findFirst({
      where: { applicationId },
      orderBy: { id: 'desc' }
    });

    const paymentCompleted = !!latestPayment
      && !!latestPayment.receivedAt
      && new Date(latestPayment.receivedAt).getTime() > 1000
      && !String(latestPayment.method || '').toUpperCase().includes('PENDING');

    if (!paymentCompleted) {
      return res.status(402).json({
        error: 'PAYMENT_REQUIRED',
        message: 'Please complete the payment before final submission.'
      });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.examApplication.update({
      where: { id: applicationId },
      data: { status: 'SUBMITTED', submittedAt: now() }
    });
    await tx.statusHistory.create({
      data: {
        applicationId,
        actorUserId: req.auth.userId,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED'
      }
    });
    return updatedApp;
  });

  return res.json({ application: updated });
  } catch (err) {
    console.error('Submit application error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Institute: list applications for my institute (filter + search)
applicationsRouter.get('/institute/list', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const q = z
    .object({
      search: z.string().optional()
    })
    .parse(req.query);

  const instituteId = req.auth.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const apps = await prisma.examApplication.findMany({
    where: {
      instituteId,
      status: 'SUBMITTED',
      ...(q.search
        ? {
            OR: [
              { applicationNo: { contains: q.search } },
              { student: { lastName: { contains: q.search } } },
              { student: { firstName: { contains: q.search } } }
            ]
          }
        : {})
    },
    include: {
      student: true,
      institute: true,
      exam: { include: { stream: true } },
      subjects: { include: { subject: true } },
      fees: { orderBy: { id: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' },
    take: 200
  });

  const paidOnlyRequired = Number(env.EXAM_FEE_PAISE ?? 0) > 0;

  const visibleApps = apps
    .map((app) => {
      const latestPayment = app.fees?.[0] ?? null;
      const paymentCompleted = !paidOnlyRequired
        ? true
        : !!latestPayment
          && !!latestPayment.receivedAt
          && new Date(latestPayment.receivedAt).getTime() > 1000
          && !String(latestPayment.method || '').toUpperCase().includes('PENDING');

      const hasStudentCoreDetails = !!(
        app.student?.firstName
        && app.student?.lastName
        && app.student?.mobile
        && app.student?.address
      );

      const subjectCount = app.subjects?.length ?? 0;
      const hasSubjects = subjectCount > 0;

      return {
        ...app,
        paymentCompleted,
        verification: {
          hasStudentCoreDetails,
          hasSubjects,
          subjectCount,
          instituteName: app.institute?.name || '',
          instituteCode: app.institute?.code || app.institute?.collegeNo || '',
          examName: app.exam?.name || '',
          examSession: app.exam?.session || '',
          examAcademicYear: app.exam?.academicYear || '',
          streamName: app.exam?.stream?.name || '',
          isReadyForVerification: paymentCompleted && hasStudentCoreDetails && hasSubjects
        }
      };
    })
    .filter((app) => app.paymentCompleted);

  return res.json({ applications: visibleApps });
});

// Institute: verify (SUBMITTED -> INSTITUTE_VERIFIED) or reject
applicationsRouter.post('/:id/institute/decision', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({
      action: z.enum(['VERIFY', 'REJECT']),
      remark: z.string().optional()
    })
    .parse(req.body);

  const instituteId = req.auth.instituteId;
  if (!instituteId) return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });

  const app = await prisma.examApplication.findFirst({ where: { id: applicationId, instituteId } });
  if (!app) return res.status(404).json({ error: 'NOT_FOUND' });

  if (app.status !== 'SUBMITTED') return res.status(400).json({ error: 'INVALID_STATE' });

  const toStatus = body.action === 'VERIFY' ? 'INSTITUTE_VERIFIED' : 'REJECTED_BY_INSTITUTE';

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.examApplication.update({
      where: { id: applicationId },
      data: {
        status: toStatus,
        instituteVerifiedAt: body.action === 'VERIFY' ? now() : null,
        instituteVerificationRemark: body.remark
      }
    });
    await tx.statusHistory.create({
      data: {
        applicationId,
        actorUserId: req.auth.userId,
        fromStatus: 'SUBMITTED',
        toStatus,
        remark: body.remark
      }
    });
    return updatedApp;
  });

  return res.json({ application: updated });
});

// Board: list visible applications (INSTITUTE_VERIFIED and above)
applicationsRouter.get('/board/list', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const q = z
    .object({
      examId: z.coerce.number().int().positive(),
      status: z.enum(['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD']).optional(),
      search: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(5).max(500).optional()
    })
    .parse(req.query);

  const page = q.page ?? 1;
  const limit = q.limit ?? 25;

  const strictStatuses = ['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD'];
  const fallbackStatuses = ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD'];

  const buildWhere = (statusCondition) => {
    const where = {
      examId: q.examId,
      status: statusCondition
    };
    if (q.search) {
      where.OR = [
        { applicationNo: { contains: q.search } },
        { institute: { name: { contains: q.search } } },
        { student: { lastName: { contains: q.search } } },
        { student: { firstName: { contains: q.search } } }
      ];
    }
    return where;
  };

  let where = buildWhere(q.status ?? { in: strictStatuses });
  let total = await prisma.examApplication.count({ where });
  let apps = await prisma.examApplication.findMany({
    where,
    include: { student: true, institute: true, exam: true },
    orderBy: { updatedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });

  // If no explicit status filter is requested and strict status set has no rows,
  // fall back to include submitted-stage data so board can still review exam data.
  if (!q.status && total === 0) {
    where = buildWhere({ in: fallbackStatuses });
    total = await prisma.examApplication.count({ where });
    apps = await prisma.examApplication.findMany({
      where,
      include: { student: true, institute: true, exam: true },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  return res.json({ applications: apps, metadata: { page, limit, total } });
});

// Board: get exams that have applications
applicationsRouter.get('/board/exams', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const includeSubmitted = String(req.query.includeSubmitted || '').toLowerCase() === 'true';
  const boardVisibleStatuses = includeSubmitted
    ? ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD']
    : ['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD'];

  const broadStatuses = ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD'];

  let exams = await prisma.exam.findMany({
    where: {
      applications: {
        some: {
          status: { in: boardVisibleStatuses }
        }
      }
    },
    include: {
      _count: {
        select: {
          applications: {
            where: {
              status: { in: boardVisibleStatuses }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Keep default board screens useful when no applications have reached verified/approved statuses yet.
  if (!includeSubmitted && exams.length === 0) {
    exams = await prisma.exam.findMany({
      where: {
        applications: {
          some: {
            status: { in: broadStatuses }
          }
        }
      },
      include: {
        _count: {
          select: {
            applications: {
              where: {
                status: { in: broadStatuses }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  return res.json({ exams });
});

// Board: consolidated student master records (exam wise, caste wise, subject wise filters)
applicationsRouter.get('/board/student-master', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const q = z
    .object({
      examId: z.coerce.number().int().positive().optional(),
      status: z.enum(['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD']).optional(),
      caste: z.string().optional(),
      subjectId: z.coerce.number().int().positive().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['updatedAt', 'exam', 'caste', 'subject', 'studentName']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(10).max(1000).optional()
    })
    .parse(req.query);

  const page = q.page ?? 1;
  const limit = q.limit ?? 100;
  const sortOrder = q.sortOrder ?? 'desc';
  const sortBy = q.sortBy ?? 'updatedAt';

  const where = {
    examId: q.examId,
    status: q.status ?? { in: ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD'] },
    student: {
      categoryCode: q.caste || undefined
    },
    subjects: q.subjectId
      ? {
          some: {
            subjectId: q.subjectId
          }
        }
      : undefined
  };

  if (q.search) {
    where.OR = [
      { applicationNo: { contains: q.search } },
      { institute: { name: { contains: q.search } } },
      { student: { firstName: { contains: q.search } } },
      { student: { lastName: { contains: q.search } } },
      { student: { studentSaralId: { contains: q.search } } },
      { student: { aadhaar: { contains: q.search } } }
    ];
  }

  const orderBy =
    sortBy === 'exam'
      ? [{ exam: { name: sortOrder } }, { updatedAt: 'desc' }]
      : sortBy === 'caste'
        ? [{ student: { categoryCode: sortOrder } }, { updatedAt: 'desc' }]
        : sortBy === 'studentName'
          ? [{ student: { lastName: sortOrder } }, { student: { firstName: sortOrder } }, { updatedAt: 'desc' }]
          : [{ updatedAt: sortOrder }];

  const applications = await prisma.examApplication.findMany({
    where,
    include: {
      exam: true,
      institute: true,
      student: true,
      subjects: {
        include: {
          subject: true
        }
      }
    },
    orderBy,
    take: 10000
  });

  let rows = applications.map(toBoardStudentMasterRow);

  if (sortBy === 'subject') {
    rows.sort((a, b) => {
      const left = a.subjectNames || '';
      const right = b.subjectNames || '';
      return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
    });
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  rows = rows.slice(start, end);

  const allCastes = Array.from(new Set(applications.map((item) => item.student?.categoryCode).filter(Boolean))).sort();

  const summaries = {
    byCaste: topGroupedCounts(applications.map((item) => item.student?.categoryCode)),
    byGender: topGroupedCounts(applications.map((item) => item.student?.gender)),
    byDistrict: topGroupedCounts(applications.map((item) => item.student?.district || item.institute?.district)),
    bySubject: topGroupedCounts(
      applications.flatMap((item) => (item.subjects || []).map((entry) => entry.subject?.name))
    )
  };

  return res.json({
    rows,
    metadata: {
      page,
      limit,
      total,
      sortBy,
      sortOrder,
      availableCastes: allCastes,
      summaries
    }
  });
});

// Board: approve/reject
applicationsRouter.post('/:id/board/decision', requireAuth, requireRole(['BOARD']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.id);
  const body = z
    .object({
      action: z.enum(['APPROVE', 'REJECT']),
      remark: z.string().optional()
    })
    .parse(req.body);

  const app = await prisma.examApplication.findUnique({ where: { id: applicationId } });
  if (!app) return res.status(404).json({ error: 'NOT_FOUND' });
  if (app.status !== 'INSTITUTE_VERIFIED') return res.status(400).json({ error: 'INVALID_STATE' });

  const toStatus = body.action === 'APPROVE' ? 'BOARD_APPROVED' : 'REJECTED_BY_BOARD';

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.examApplication.update({
      where: { id: applicationId },
      data: {
        status: toStatus,
        boardApprovedAt: body.action === 'APPROVE' ? now() : null,
        boardRemark: body.remark
      }
    });
    await tx.statusHistory.create({
      data: {
        applicationId,
        actorUserId: req.auth.userId,
        fromStatus: 'INSTITUTE_VERIFIED',
        toStatus,
        remark: body.remark
      }
    });
    return updatedApp;
  });

  return res.json({ application: updated });
});
