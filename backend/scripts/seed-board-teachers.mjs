import 'dotenv/config';
import { prisma } from '../src/prisma.js';

const firstNames = ['Asha', 'Rohit', 'Meena', 'Vikram', 'Anita', 'Sanjay', 'Pooja', 'Nitin', 'Savita', 'Mahesh', 'Kiran', 'Neha', 'Rajesh', 'Deepa', 'Pravin', 'Shilpa', 'Arjun', 'Komal', 'Suresh', 'Manisha'];
const lastNames = ['Patil', 'Shinde', 'Jadhav', 'More', 'Kadam', 'Chavan', 'Pawar', 'Deshmukh', 'Kulkarni', 'Joshi', 'Shaikh', 'Khan', 'Kamble', 'Gaikwad', 'Pathan'];
const subjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Marathi', 'History', 'Geography', 'Economics', 'Accountancy', 'Computer Science'];
const designations = ['Assistant Teacher', 'Senior Teacher', 'Lecturer'];
const teacherTypes = ['Aided', 'Unaided', 'Partially Aided 80', 'Permanent Unaided'];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatGovtId(num) {
  return `AAD${String(num).padStart(10, '0')}`;
}

function dateYearsAgo(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(randomInt(0, 11));
  d.setDate(randomInt(1, 28));
  return d;
}

async function seedBoardTeachers() {
  const institutes = await prisma.institute.findMany({
    where: { status: { in: ['APPROVED', 'PENDING'] } },
    orderBy: [{ id: 'asc' }],
    take: 12,
    select: { id: true, name: true }
  });

  if (!institutes.length) {
    console.log('No institutes found. Seed institutes first.');
    return;
  }

  // Create 40 unique teachers distributed across institutes.
  let teacherCounter = 0;
  for (const inst of institutes) {
    for (let i = 0; i < 4; i += 1) {
      teacherCounter += 1;
      const fullName = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
      const serviceYears = randomInt(3, 28);
      const examinerYears = randomInt(0, Math.min(12, serviceYears));
      const moderatorYears = randomInt(0, Math.min(8, examinerYears));
      const chiefYears = randomInt(0, Math.min(5, moderatorYears));

      await prisma.teacher.create({
        data: {
          instituteId: inst.id,
          fullName,
          governmentId: formatGovtId(100000 + teacherCounter),
          subjectSpecialization: randomFrom(subjects),
          designation: randomFrom(designations),
          teacherType: randomFrom(teacherTypes),
          serviceStartDate: dateYearsAgo(serviceYears),
          appointmentDate: dateYearsAgo(Math.max(serviceYears - 1, 1)),
          dob: dateYearsAgo(serviceYears + randomInt(22, 30)),
          gender: randomFrom(['Male', 'Female']),
          email: `teacher${teacherCounter}@example.org`,
          mobile: `9${String(100000000 + teacherCounter).slice(0, 9)}`,
          active: Math.random() > 0.15,
          examinerExperienceYears: examinerYears,
          previousExaminerAppointmentNo: examinerYears > 0 ? `EX-${teacherCounter}-${randomInt(100, 999)}` : null,
          moderatorExperienceYears: moderatorYears,
          lastModeratorName: moderatorYears > 0 ? `${randomFrom(firstNames)} ${randomFrom(lastNames)}` : null,
          lastModeratorAppointmentNo: moderatorYears > 0 ? `MD-${teacherCounter}-${randomInt(100, 999)}` : null,
          lastModeratorCollegeName: moderatorYears > 0 ? randomFrom(institutes).name : null,
          chiefModeratorExperienceYears: chiefYears,
          lastChiefModeratorName: chiefYears > 0 ? `${randomFrom(firstNames)} ${randomFrom(lastNames)}` : null,
          lastChiefModeratorAppointmentNo: chiefYears > 0 ? `CM-${teacherCounter}-${randomInt(100, 999)}` : null,
          lastChiefModeratorCollegeName: chiefYears > 0 ? randomFrom(institutes).name : null,
          casterCategory: randomFrom(['OPEN', 'SC', 'ST', 'OBC', 'NTB', 'NTC', 'EWS'])
        }
      });
    }
  }

  // Add 12 duplicate teachers across different institutes to test merged/multi-institute board view.
  for (let j = 0; j < 12; j += 1) {
    const sourceGovtId = formatGovtId(100001 + randomInt(0, 39));
    const inst = institutes[(j + 5) % institutes.length];
    const serviceYears = randomInt(6, 22);

    await prisma.teacher.create({
      data: {
        instituteId: inst.id,
        fullName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        governmentId: sourceGovtId,
        subjectSpecialization: randomFrom(subjects),
        designation: randomFrom(designations),
        teacherType: randomFrom(teacherTypes),
        serviceStartDate: dateYearsAgo(serviceYears),
        appointmentDate: dateYearsAgo(Math.max(serviceYears - 2, 1)),
        dob: dateYearsAgo(serviceYears + randomInt(23, 30)),
        gender: randomFrom(['Male', 'Female']),
        email: `multi${j + 1}@example.org`,
        mobile: `8${String(200000000 + j).slice(0, 9)}`,
        active: true,
        examinerExperienceYears: randomInt(1, 10),
        previousExaminerAppointmentNo: `EX-M-${j + 1}`,
        moderatorExperienceYears: randomInt(0, 6),
        lastModeratorName: randomFrom(firstNames),
        lastModeratorAppointmentNo: `MD-M-${j + 1}`,
        lastModeratorCollegeName: randomFrom(institutes).name,
        chiefModeratorExperienceYears: randomInt(0, 4),
        lastChiefModeratorName: randomFrom(firstNames),
        lastChiefModeratorAppointmentNo: `CM-M-${j + 1}`,
        lastChiefModeratorCollegeName: randomFrom(institutes).name,
        casterCategory: randomFrom(['OPEN', 'SC', 'ST', 'OBC', 'NTB', 'NTC', 'EWS'])
      }
    });
  }

  const total = await prisma.teacher.count();
  console.log(`Seed complete. Total teachers in DB: ${total}`);
}

seedBoardTeachers()
  .catch((error) => {
    console.error('Failed to seed board teachers:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
