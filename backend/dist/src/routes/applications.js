import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
export const applicationsRouter = Router();
function now() {
    return new Date();
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
    if (!app)
        return null;
    if (auth.role === 'SUPER_ADMIN')
        return app;
    if (auth.role === 'BOARD') {
        if (app.status === 'INSTITUTE_VERIFIED' || app.status === 'BOARD_APPROVED' || app.status === 'REJECTED_BY_BOARD')
            return app;
        return null;
    }
    if (auth.role === 'INSTITUTE') {
        if (!auth.instituteId || auth.instituteId !== app.instituteId)
            return null;
        return app;
    }
    if (auth.role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { id: app.studentId, userId: auth.userId } });
        if (!student)
            return null;
        return app;
    }
    return null;
}
// Student: list my applications
applicationsRouter.get('/my', requireAuth, requireRole(['STUDENT']), async (req, res) => {
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student)
        return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });
    const apps = await prisma.examApplication.findMany({
        where: { studentId: student.id },
        include: { exam: true },
        orderBy: { updatedAt: 'desc' },
        take: 50
    });
    return res.json({ applications: apps });
});
// Student: create application for an exam
applicationsRouter.post('/', requireAuth, requireRole(['STUDENT']), async (req, res) => {
    const body = z
        .object({
        examId: z.number().int().positive(),
        candidateType: z.enum(['REGULAR', 'REPEATER', 'ATKT', 'BACKLOG', 'IMPROVEMENT', 'PRIVATE'])
    })
        .parse(req.body);
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student)
        return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });
    const exam = await prisma.exam.findUnique({ where: { id: body.examId } });
    if (!exam)
        return res.status(404).json({ error: 'EXAM_NOT_FOUND' });
    const institute = await prisma.institute.findUnique({ where: { id: student.instituteId } });
    if (!institute)
        return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });
    if (institute.status !== 'APPROVED')
        return res.status(403).json({ error: 'INSTITUTE_NOT_APPROVED' });
    if (!institute.acceptingApplications)
        return res.status(403).json({ error: 'INSTITUTE_NOT_ACCEPTING_APPLICATIONS' });
    const app = await prisma.examApplication.create({
        data: {
            instituteId: student.instituteId,
            studentId: student.id,
            examId: exam.id,
            applicationNo: `APP-${Date.now()}`,
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
    return res.json({ application: app });
});
// Get application (scoped by role/tenant)
applicationsRouter.get('/:id', requireAuth, async (req, res) => {
    const applicationId = z.coerce.number().int().positive().parse(req.params.id);
    const app = await getApplicationScoped(applicationId, req.auth);
    if (!app)
        return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ application: app });
});
// Student: update DRAFT application fields + subject selections
applicationsRouter.put('/:id', requireAuth, requireRole(['STUDENT']), async (req, res) => {
    const applicationId = z.coerce.number().int().positive().parse(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student)
        return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });
    const app = await prisma.examApplication.findFirst({ where: { id: applicationId, studentId: student.id } });
    if (!app)
        return res.status(404).json({ error: 'NOT_FOUND' });
    if (app.status !== 'DRAFT')
        return res.status(400).json({ error: 'NOT_EDITABLE' });
    const body = z
        .object({
        // exam_applications
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
            .array(z.object({
            subjectId: z.number().int().positive(),
            langOfAnsCode: z.string().optional(),
            isExemptedClaim: z.boolean().optional()
        }))
            .optional(),
        exemptedSubjects: z
            .array(z.object({
            subjectName: z.string().optional(),
            subjectCode: z.string().optional(),
            seatNo: z.string().optional(),
            month: z.string().optional(),
            year: z.number().int().min(1990).max(2100).optional(),
            marksObt: z.string().optional()
        }))
            .optional()
    })
        .parse(req.body);
    const exam = await prisma.exam.findUnique({ where: { id: app.examId } });
    if (!exam)
        return res.status(404).json({ error: 'EXAM_NOT_FOUND' });
    const institute = await prisma.institute.findUnique({ where: { id: student.instituteId } });
    if (!institute)
        return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });
    if (institute.status !== 'APPROVED')
        return res.status(403).json({ error: 'INSTITUTE_NOT_APPROVED' });
    if (!institute.acceptingApplications)
        return res.status(403).json({ error: 'INSTITUTE_NOT_ACCEPTING_APPLICATIONS' });
    if (body.subjects && body.subjects.length > 0) {
        const subjectIds = body.subjects.map((s) => s.subjectId);
        const validStream = await prisma.instituteStreamSubject.findMany({
            where: { instituteId: student.instituteId, streamId: exam.streamId, subjectId: { in: subjectIds } },
            include: { subject: true }
        });
        if (validStream.length !== subjectIds.length) {
            return res.status(400).json({ error: 'INVALID_SUBJECT_SELECTION', message: 'Selected subject is not mapped for this institute and stream.' });
        }
        const selectedCategories = [...new Set(validStream.map((m) => m.subject.category))];
        if (!selectedCategories.includes('language') || !selectedCategories.includes('Compulsory')) {
            return res.status(400).json({
                error: 'INVALID_SUBJECT_CATEGORY',
                message: 'You must select at least one language and one compulsory subject.'
            });
        }
    }
    const updated = await prisma.$transaction(async (tx) => {
        if (body.student) {
            await tx.student.update({
                where: { id: student.id },
                data: {
                    ...body.student,
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
                indexNo: body.indexNo,
                udiseNo: body.udiseNo,
                studentSaralId: body.studentSaralId,
                applSrNo: body.applSrNo,
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
});
// Student: submit (DRAFT -> SUBMITTED)
applicationsRouter.post('/:id/submit', requireAuth, requireRole(['STUDENT']), async (req, res) => {
    const applicationId = z.coerce.number().int().positive().parse(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
    if (!student)
        return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });
    const app = await prisma.examApplication.findFirst({ where: { id: applicationId, studentId: student.id } });
    if (!app)
        return res.status(404).json({ error: 'NOT_FOUND' });
    if (app.status !== 'DRAFT')
        return res.status(400).json({ error: 'INVALID_STATE' });
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
});
// Institute: list applications for my institute (filter + search)
applicationsRouter.get('/institute/list', requireAuth, requireRole(['INSTITUTE']), async (req, res) => {
    const q = z
        .object({
        status: z
            .enum([
            'DRAFT',
            'SUBMITTED',
            'INSTITUTE_VERIFIED',
            'BOARD_APPROVED',
            'REJECTED_BY_INSTITUTE',
            'REJECTED_BY_BOARD'
        ])
            .optional(),
        search: z.string().optional()
    })
        .parse(req.query);
    const instituteId = req.auth.instituteId;
    if (!instituteId)
        return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });
    const apps = await prisma.examApplication.findMany({
        where: {
            instituteId,
            status: q.status,
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
        include: { student: true, exam: true },
        orderBy: { updatedAt: 'desc' },
        take: 200
    });
    return res.json({ applications: apps });
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
    if (!instituteId)
        return res.status(400).json({ error: 'INSTITUTE_REQUIRED' });
    const app = await prisma.examApplication.findFirst({ where: { id: applicationId, instituteId } });
    if (!app)
        return res.status(404).json({ error: 'NOT_FOUND' });
    if (app.status !== 'SUBMITTED')
        return res.status(400).json({ error: 'INVALID_STATE' });
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
applicationsRouter.get('/board/list', requireAuth, requireRole(['BOARD']), async (req, res) => {
    const q = z
        .object({
        status: z.enum(['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD']).optional(),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(5).max(100).optional()
    })
        .parse(req.query);
    const page = q.page ?? 1;
    const limit = q.limit ?? 25;
    const where = {
        status: q.status ?? { in: ['INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_BOARD'] }
    };
    if (q.search) {
        where.OR = [
            { applicationNo: { contains: q.search } },
            { institute: { name: { contains: q.search } } },
            { student: { lastName: { contains: q.search } } },
            { student: { firstName: { contains: q.search } } }
        ];
    }
    const total = await prisma.examApplication.count({ where });
    const apps = await prisma.examApplication.findMany({
        where,
        include: { student: true, institute: true, exam: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
    });
    return res.json({ applications: apps, metadata: { page, limit, total } });
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
    if (!app)
        return res.status(404).json({ error: 'NOT_FOUND' });
    if (app.status !== 'INSTITUTE_VERIFIED')
        return res.status(400).json({ error: 'INVALID_STATE' });
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
