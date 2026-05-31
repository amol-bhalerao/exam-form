/**
 * Seeds a minimal mock exam + institute-verified application for E2E testing.
 */
import 'dotenv/config';
import { prisma } from '../src/prisma.js';

async function main() {
  const board = await prisma.user.findUnique({ where: { username: 'board' } });
  const studentUser = await prisma.user.findUnique({ where: { username: 'student1' } });
  const student = studentUser
    ? await prisma.student.findFirst({ where: { userId: studentUser.id } })
    : null;

  if (!board || !student) {
    console.error('Run npm run db:seed-users first (need board + student1 with profile).');
    process.exitCode = 1;
    return;
  }

  let stream = await prisma.stream.findFirst({ where: { shortCode: 'SCI' } });
  if (!stream) {
    stream = await prisma.stream.create({ data: { name: 'Science', shortCode: 'SCI' } });
  }

  let exam = await prisma.exam.findFirst({ where: { examCode: 'MOCK001' } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        name: 'Mock HSC Exam 2025-26',
        academicYear: '2025-26',
        session: 'FEB-MAR',
        streamId: null,
        examCode: 'MOCK001',
        applicationOpen: new Date(Date.now() - 86400000),
        applicationClose: new Date(Date.now() + 90 * 86400000),
        createdByUserId: board.id,
        instructions: 'Mock exam for UI/API testing'
      }
    });
    console.log('Created mock exam', exam.id);
  }

  const subjects = await prisma.subject.findMany({ take: 3 });
  if (subjects.length < 1) {
    await prisma.subject.createMany({
      data: [
        { name: 'English', code: '1', category: 'Compulsory' },
        { name: 'Physical Education', code: '30', category: 'Compulsory' },
        { name: 'Environment Education', code: '31', category: 'Compulsory' }
      ],
      skipDuplicates: true
    });
  }

  const subjectRows = await prisma.subject.findMany({ take: 3 });
  let app = await prisma.examApplication.findFirst({
    where: { studentId: student.id, examId: exam.id }
  });

  if (!app) {
    app = await prisma.examApplication.create({
      data: {
        instituteId: student.instituteId,
        studentId: student.id,
        examId: exam.id,
        applicationNo: `MOCK-${Date.now()}`,
        status: 'INSTITUTE_VERIFIED',
        candidateType: 'REGULAR',
        submittedAt: new Date(),
        instituteVerifiedAt: new Date(),
        subjects: {
          create: subjectRows.map((s) => ({ subjectId: s.id, langOfAnsCode: 'ENG' }))
        }
      }
    });
    console.log('Created mock application', app.id, app.applicationNo);
  } else {
    await prisma.examApplication.update({
      where: { id: app.id },
      data: { status: 'INSTITUTE_VERIFIED', instituteVerifiedAt: new Date() }
    });
    console.log('Updated existing application', app.id, '→ INSTITUTE_VERIFIED');
  }

  await prisma.feeReimbursement.upsert({
    where: { studentId: student.id },
    update: {
      accountHolder: 'Demo Student',
      accountNo: '123456789012',
      ifscCode: 'SBIN0001234'
    },
    create: {
      studentId: student.id,
      accountHolder: 'Demo Student',
      accountNo: '123456789012',
      ifscCode: 'SBIN0001234'
    }
  });

  console.log('Mock data ready. Print test URL: /print/board/forms?ids=' + app.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
