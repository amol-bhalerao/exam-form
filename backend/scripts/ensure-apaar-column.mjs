import { prisma } from '../src/prisma.js';

const statements = [
  ['apaarId', 'ALTER TABLE students ADD COLUMN apaarId VARCHAR(20) NULL AFTER aadhaar'],
  ['district', 'ALTER TABLE students ADD COLUMN district VARCHAR(100) NULL AFTER address'],
  ['taluka', 'ALTER TABLE students ADD COLUMN taluka VARCHAR(100) NULL AFTER district'],
  ['village', 'ALTER TABLE students ADD COLUMN village VARCHAR(100) NULL AFTER taluka']
];

try {
  for (const [name, sql] of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`${name} column added`);
    } catch (e) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes('duplicate column')) {
        console.log(`${name} column already exists`);
      } else {
        throw e;
      }
    }
  }
} finally {
  await prisma.$disconnect();
}
