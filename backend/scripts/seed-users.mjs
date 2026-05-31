import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';

const PASSWORD = 'Admin@123';

const USERS = [
  { username: 'superadmin', role: 'SUPER_ADMIN', email: 'superadmin@example.com', instituteCode: null },
  { username: 'board', role: 'BOARD', email: 'board@example.com', instituteCode: null },
  { username: 'institute1', role: 'INSTITUTE', email: 'institute1@example.com', instituteCode: 'INST001' },
  { username: 'student1', role: 'STUDENT', email: 'student1@example.com', instituteCode: 'INST001' }
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const spec of USERS) {
    const role = await prisma.role.upsert({
      where: { name: spec.role },
      update: {},
      create: { name: spec.role }
    });

    let instituteId = null;
    if (spec.instituteCode) {
      const inst = await prisma.institute.findFirst({ where: { code: spec.instituteCode } });
      if (!inst) {
        console.warn(`Institute ${spec.instituteCode} not found; skipping ${spec.username}`);
        continue;
      }
      instituteId = inst.id;
    }

    await prisma.user.upsert({
      where: { username: spec.username },
      update: {
        passwordHash,
        status: 'ACTIVE',
        roleId: role.id,
        instituteId,
        authProvider: 'local',
        email: spec.email
      },
      create: {
        username: spec.username,
        passwordHash,
        status: 'ACTIVE',
        roleId: role.id,
        instituteId,
        authProvider: 'local',
        email: spec.email
      }
    });
    console.log(`OK ${spec.username} / ${PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
