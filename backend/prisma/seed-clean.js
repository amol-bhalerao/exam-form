import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Upsert Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN' }
    }),
    prisma.role.upsert({
      where: { name: 'BOARD' },
      update: {},
      create: { name: 'BOARD' }
    }),
    prisma.role.upsert({
      where: { name: 'INSTITUTE' },
      update: {},
      create: { name: 'INSTITUTE' }
    }),
    prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT' }
    })
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // 2. Create Institutes
  const institute1 = await prisma.institute.upsert({
    where: { code: 'INST001' },
    update: {},
    create: {
      collegeNo: 'COLL001',
      udiseNo: 'UDISE001',
      name: 'Demo Junior College 1',
      code: 'INST001',
      address: 'Demo Address, Pune, Maharashtra',
      district: 'Pune',
      city: 'Pune',
      pincode: '411001',
      contactPerson: 'Principal',
      contactEmail: 'inst1@example.com',
      contactMobile: '9999999999',
      status: 'APPROVED',
      acceptingApplications: true
    }
  });

  const institute2 = await prisma.institute.upsert({
    where: { code: 'INST002' },
    update: {},
    create: {
      collegeNo: 'COLL002',
      udiseNo: 'UDISE002',
      name: 'Demo College 2',
      code: 'INST002',
      address: 'Demo Address 2, Mumbai, Maharashtra',
      district: 'Mumbai',
      city: 'Mumbai',
      pincode: '400001',
      status: 'APPROVED',
      acceptingApplications: true
    }
  });

  console.log(`✅ Created ${2} institutes`);

  // 3. Create Test Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const superAdminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash,
      roleId: roles[0].id, // SUPER_ADMIN
      status: 'ACTIVE'
    }
  });

  const boardUser = await prisma.user.upsert({
    where: { username: 'board' },
    update: {},
    create: {
      username: 'board',
      email: 'board@example.com',
      passwordHash,
      roleId: roles[1].id, // BOARD
      status: 'ACTIVE'
    }
  });

  const instituteUser = await prisma.user.upsert({
    where: { username: 'institute1' },
    update: {},
    create: {
      username: 'institute1',
      email: 'inst@example.com',
      passwordHash,
      roleId: roles[2].id, // INSTITUTE
      instituteId: institute1.id,
      status: 'ACTIVE'
    }
  });

  const studentUser = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      email: 'student@example.com',
      passwordHash,
      roleId: roles[3].id, // STUDENT
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Created ${4} users`);

  // 4. Create Student Profile (linked to student user)
  const studentProfile = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      instituteId: institute1.id,
      streamCode: 'Science',
      firstName: 'John',
      lastName: 'Doe',
      mobile: '9876543210'
    }
  });

  console.log(`✅ Created ${1} student profile(s)`);

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Username: superadmin | Password: Password@123');
  console.log('   Username: board | Password: Password@123');
  console.log('   Username: institute1 | Password: Password@123');
  console.log('   Username: student1 | Password: Password@123');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
