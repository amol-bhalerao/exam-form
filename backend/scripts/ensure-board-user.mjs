import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';

const username = 'board_demo';
const plainPassword = 'Board@12345';

async function ensureBoardUser() {
  const role = await prisma.role.findUnique({ where: { name: 'BOARD' } });
  if (!role) {
    throw new Error('BOARD role missing. Seed roles first.');
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        roleId: role.id,
        email: existing.email || 'board_demo@example.org'
      }
    });
    console.log('Updated existing board_demo user');
  } else {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        roleId: role.id,
        status: 'ACTIVE',
        email: 'board_demo@example.org'
      }
    });
    console.log('Created board_demo user');
  }

  console.log('Credentials => board_demo / Board@12345');
}

ensureBoardUser()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
