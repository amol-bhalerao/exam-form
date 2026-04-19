import 'dotenv/config';
import { prisma } from './src/prisma.js';
console.log('query_start');
try {
  const count = await prisma.user.count();
  console.log('user_count=' + count);
} catch (e) {
  console.error('query_error=' + (e?.message || e));
} finally {
  await prisma.$disconnect().catch(() => {});
  console.log('done');
}
