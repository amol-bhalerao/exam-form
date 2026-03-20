import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function upsertRole(name) {
    return prisma.role.upsert({
        where: { name },
        update: {},
        create: { name }
    });
}
async function main() {
    const [superAdminRole, boardRole, instituteRole, studentRole] = await Promise.all([
        upsertRole('SUPER_ADMIN'),
        upsertRole('BOARD'),
        upsertRole('INSTITUTE'),
        upsertRole('STUDENT')
    ]);
    const passwordHash = await bcrypt.hash('Password@123', 10);
    const institute1 = await prisma.institute.upsert({
        where: { code: 'INST001' },
        update: { status: 'APPROVED' },
        create: {
            name: 'Demo Junior College 1',
            code: 'INST001',
            address: 'Demo Address, Maharashtra',
            contactPerson: 'Principal',
            contactEmail: 'inst1@example.com',
            contactMobile: '9999999999',
            status: 'APPROVED'
        }
    });
    await prisma.institute.upsert({
        where: { code: 'INST002' },
        update: { status: 'PENDING' },
        create: {
            name: 'Demo Junior College 2 (Pending)',
            code: 'INST002',
            status: 'PENDING'
        }
    });
    await prisma.user.upsert({
        where: { username: 'superadmin' },
        update: { roleId: superAdminRole.id, status: 'ACTIVE', passwordHash },
        create: {
            username: 'superadmin',
            passwordHash,
            roleId: superAdminRole.id,
            status: 'ACTIVE',
            email: 'superadmin@example.com'
        }
    });
    await prisma.user.upsert({
        where: { username: 'board' },
        update: { roleId: boardRole.id, status: 'ACTIVE', passwordHash },
        create: {
            username: 'board',
            passwordHash,
            roleId: boardRole.id,
            status: 'ACTIVE',
            email: 'board@example.com'
        }
    });
    await prisma.user.upsert({
        where: { username: 'institute1' },
        update: {
            roleId: instituteRole.id,
            instituteId: institute1.id,
            status: 'ACTIVE',
            passwordHash
        },
        create: {
            username: 'institute1',
            passwordHash,
            roleId: instituteRole.id,
            instituteId: institute1.id,
            status: 'ACTIVE',
            email: 'institute1@example.com'
        }
    });
    const studentUser = await prisma.user.upsert({
        where: { username: 'student1' },
        update: {
            roleId: studentRole.id,
            instituteId: institute1.id,
            status: 'ACTIVE',
            passwordHash
        },
        create: {
            username: 'student1',
            passwordHash,
            roleId: studentRole.id,
            instituteId: institute1.id,
            status: 'ACTIVE',
            email: 'student1@example.com'
        }
    });
    const stream = await prisma.stream.upsert({
        where: { name: 'Science' },
        update: {},
        create: { name: 'Science' }
    });
    await prisma.subject.upsert({
        where: { code: '01' },
        update: { name: 'English' },
        create: { code: '01', name: 'English' }
    });
    await prisma.subject.upsert({
        where: { code: '30' },
        update: { name: 'Physical Education' },
        create: { code: '30', name: 'Physical Education' }
    });
    await prisma.subject.upsert({
        where: { code: '31' },
        update: { name: 'Environment Education' },
        create: { code: '31', name: 'Environment Education' }
    });
    const exam = await prisma.exam.create({
        data: {
            name: 'HSC Examination',
            academicYear: '2025-26',
            session: 'FEB-MAR',
            streamId: stream.id,
            applicationOpen: new Date(Date.now() - 1000 * 60 * 60 * 24),
            applicationClose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            lateFeeClose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40),
            createdByUserId: (await prisma.user.findUniqueOrThrow({ where: { username: 'board' } })).id,
            instructions: 'Demo exam window seeded for development.'
        }
    });
    const student = await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
            instituteId: institute1.id,
            userId: studentUser.id,
            firstName: 'Demo',
            middleName: 'Student',
            lastName: 'One',
            motherName: 'DemoMother',
            mobile: '9000000000',
            address: 'Demo address line',
            pinCode: '411001',
            gender: 'MALE',
            streamCode: '1'
        }
    });
    await prisma.examApplication.create({
        data: {
            instituteId: institute1.id,
            studentId: student.id,
            examId: exam.id,
            applicationNo: `APP-${Date.now()}`,
            status: 'DRAFT',
            candidateType: 'REGULAR'
        }
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
