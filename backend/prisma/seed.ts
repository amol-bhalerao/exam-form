import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertRole(name: string) {
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
      collegeNo: 'COLL001',
      udiseNo: '27280100123',
      name: 'Demo Junior College 1',
      code: 'INST001',
      address: 'Demo Address, Maharashtra',
      district: 'Pune',
      taluka: 'Pune City',
      city: 'Pune',
      pincode: '411001',
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
      collegeNo: 'COLL002',
      udiseNo: '27280100124',
      name: 'Demo Junior College 2 (Pending)',
      code: 'INST002',
      address: 'Pending address',
      district: 'Pune',
      taluka: 'Pune City',
      city: 'Pune',
      pincode: '411001',
      status: 'PENDING'
    }
  });

  const collegeSeed = JSON.parse(fs.readFileSync(new URL('./college_seed.json', import.meta.url), 'utf8'));
  for (const inst of collegeSeed) {
    if (!inst.code || !inst.name) continue;
    await prisma.institute.upsert({
      where: { code: inst.code },
      update: {
        name: inst.name,
        collegeNo: inst.collegeNo,
        udiseNo: inst.udiseNo,
        city: inst.city,
        district: inst.district,
        status: inst.status || 'APPROVED'
      },
      create: {
        collegeNo: inst.collegeNo || inst.code,
        udiseNo: inst.udiseNo || '',
        name: inst.name,
        code: inst.code,
        city: inst.city || '',
        district: inst.district || '',
        status: inst.status || 'APPROVED'
      }
    });
  }

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

  const seedSubjects = [
    { code: '1', name: 'English', category: 'Language' },
    { code: '2', name: 'Marathi', category: 'Language' },
    { code: '3', name: 'Gujarati', category: 'Language' },
    { code: '4', name: 'Hindi', category: 'Language' },
    { code: '5', name: 'Urdu', category: 'Language' },
    { code: '6', name: 'Kannada', category: 'Language' },
    { code: '7', name: 'Sindhi', category: 'Language' },
    { code: '8', name: 'Malayalam', category: 'Language' },
    { code: '9', name: 'Tamil', category: 'Language' },
    { code: '10', name: 'Telugu', category: 'Language' },
    { code: '11', name: 'Punjabi', category: 'Language' },
    { code: '12', name: 'Bengali', category: 'Language' },
    { code: '13', name: 'French', category: 'Language' },
    { code: '14', name: 'German', category: 'Language' },
    { code: '20', name: 'Russian', category: 'Language' },
    { code: '21', name: 'Japanese', category: 'Language' },
    { code: '87', name: 'Avesta Pahalavi', category: 'Language' },
    { code: '1', name: 'English', category: 'Compulsory' },
    { code: '30', name: 'Health & Physical Education', category: 'Compulsory' },
    { code: '31', name: 'Env.Edu. & water security.', category: 'Compulsory' },
    { code: '16', name: 'Ardhamagadhi', category: 'Optional' },
    { code: '22', name: 'English Literature', category: 'Optional' },
    { code: '23', name: 'Marathi Literature', category: 'Optional' },
    { code: '24', name: 'Hindi Applied', category: 'Optional' },
    { code: '25', name: 'Spanish', category: 'Optional' },
    { code: '26', name: 'Chinese', category: 'Optional' },
    { code: '27', name: 'Maharashtri Prakrut', category: 'Optional' },
    { code: '32', name: 'General Knowledge', category: 'Optional' },
    { code: '33', name: 'Sanskrit', category: 'Optional' },
    { code: '35', name: 'Pali', category: 'Optional' },
    { code: '36', name: 'Arabic', category: 'Optional' },
    { code: '37', name: 'Persian', category: 'Optional' },
    { code: '38', name: 'History', category: 'Optional' },
    { code: '39', name: 'Geography', category: 'Optional' },
    { code: '40', name: 'Mathematics & Statistics (For Arts and Science)', category: 'Optional' },
    { code: '41', name: 'Geology', category: 'Optional' },
    { code: '42', name: 'Political Science', category: 'Optional' },
    { code: '43', name: 'Child Development', category: 'Optional' },
    { code: '44', name: 'Textiles', category: 'Optional' },
    { code: '45', name: 'Sociology', category: 'Optional' },
    { code: '46', name: 'Philosophy', category: 'Optional' },
    { code: '47', name: 'Logic', category: 'Optional' },
    { code: '48', name: 'Psychology', category: 'Optional' },
    { code: '49', name: 'Economics', category: 'Optional' },
    { code: '50', name: 'Book Keeping & Accountancy', category: 'Optional' },
    { code: '51', name: 'Organization of Comm. & Mgmt.', category: 'Optional' },
    { code: '52', name: 'Secretarial Practice', category: 'Optional' },
    { code: '53', name: 'Co-operation', category: 'Optional' },
    { code: '54', name: 'Physics', category: 'Optional' },
    { code: '55', name: 'Chemistry', category: 'Optional' },
    { code: '56', name: 'Biology', category: 'Optional' },
    { code: '57', name: 'Drawing', category: 'Optional' },
    { code: '58', name: 'Design & Colour', category: 'Optional' },
    { code: '59', name: 'Pictorial Composition', category: 'Optional' },
    { code: '60', name: 'History of Arts & Apprec.', category: 'Optional' },
    { code: '61', name: 'Home Management', category: 'Optional' },
    { code: '62', name: 'Food Science and Technology', category: 'Optional' },
    { code: '65', name: 'Hist. & Dev. of Indian Music', category: 'Optional' },
    { code: '66', name: 'Vocal Light Music', category: 'Optional' },
    { code: '67', name: 'Vocal Classical Music', category: 'Optional' },
    { code: '68', name: 'Instrumental Music', category: 'Optional' },
    { code: '69', name: 'Percussion', category: 'Optional' },
    { code: '73', name: 'European Music', category: 'Optional' },
    { code: '75', name: 'Agriculture Science & Tech.', category: 'Optional' },
    { code: '76', name: 'Animal Science & Tech.', category: 'Optional' },
    { code: '77', name: 'Defence Studies', category: 'Optional' },
    { code: '78', name: 'Education', category: 'Optional' },
    { code: '88', name: 'Maths & Stat. (Commerce)', category: 'Optional' },
    { code: '90', name: 'General Foundation Course', category: 'Optional' },
    { code: '91', name: 'Dancing Theory', category: 'Optional' },
    { code: '97', name: 'Information Technology (Sci)', category: 'Optional' },
    { code: '98', name: 'Information Technology (Art)', category: 'Optional' },
    { code: '99', name: 'Information Technology (Com)', category: 'Optional' },
    { code: 'A1', name: 'Electrical Maintenance', category: 'Bifocal' },
    { code: 'A2', name: 'Mechanical Maintenance', category: 'Bifocal' },
    { code: 'A3', name: 'Scooter & Motorcycle Serv.', category: 'Bifocal' },
    { code: 'A4', name: 'General Civil Engineering', category: 'Bifocal' },
    { code: 'A5', name: 'Banking', category: 'Bifocal' },
    { code: 'A7', name: 'Office Management', category: 'Bifocal' },
    { code: 'A8', name: 'Marketing and Salesmanship', category: 'Bifocal' },
    { code: 'A9', name: 'Small Industries and Self-emp.', category: 'Bifocal' },
    { code: 'B2', name: 'Animal Science and Dairying', category: 'Bifocal' },
    { code: 'B4', name: 'Crop Science', category: 'Bifocal' },
    { code: 'B5', name: 'Horticulture', category: 'Bifocal' },
    { code: 'B9', name: 'Fish Processing Technology', category: 'Bifocal' },
    { code: 'C1', name: 'Fresh Water Fish Culture', category: 'Bifocal' },
    { code: 'C2', name: 'Electronics', category: 'Bifocal' },
    { code: 'D9', name: 'Computer Science', category: 'Bifocal' },
    { code: 'EA/EB/EC', name: 'Electronics Technology', category: 'Vocational' },
    { code: 'FA/FB/FC', name: 'Electrical Technology', category: 'Vocational' },
    { code: 'GA/GB/GC', name: 'Automobile Technology', category: 'Vocational' },
    { code: 'HA/HB/HC', name: 'Construction Technology', category: 'Vocational' },
    { code: 'IA/IB/IC', name: 'Mechanical Technology', category: 'Vocational' },
    { code: 'JA/JB/JC', name: 'Computer Technology', category: 'Vocational' },
    { code: 'KA/KB/KC', name: 'Horticulture', category: 'Vocational' },
    { code: 'LA/LB/LC', name: 'Crop Science', category: 'Vocational' },
    { code: 'MA/MB/MC', name: 'Animal Husbandry And Dairy', category: 'Vocational' },
    { code: 'NA/NB/NC', name: 'Fisheries Technology', category: 'Vocational' },
    { code: 'OA/OB/OC', name: 'Medical Laboratory Tech.', category: 'Vocational' },
    { code: 'PA/PB/PC', name: 'Radiology Technician', category: 'Vocational' },
    { code: 'QA/QB/QC', name: 'Child Old Age & Hlt. Care', category: 'Vocational' },
    { code: 'RA/RB/RC', name: 'Ophthalmic Technician', category: 'Vocational' },
    { code: 'SA/SB/SC', name: 'Food Products Technology', category: 'Vocational' },
    { code: 'TA/TB/TC', name: 'Tourism And Hospitality Man.', category: 'Vocational' },
    { code: 'UA/UB/UC', name: 'Accounting And Off. Mangmnt.', category: 'Vocational' },
    { code: 'VA/VB/VC', name: 'Marketing And Retail Managementt.', category: 'Vocational' },
    { code: 'WA/WB/WC', name: 'Logistics Supply Management.', category: 'Vocational' },
    { code: 'XA/XB/XC', name: 'Banking Fin. Serv and Insur.', category: 'Vocational' }
  ];

  const dedupedSubjects = Array.from(
    new Map(seedSubjects.map((s) => [s.code, s])).values()
  );

  for (const subject of dedupedSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { name: subject.name, category: subject.category },
      create: { code: subject.code, name: subject.name, category: subject.category }
    });
  }

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

