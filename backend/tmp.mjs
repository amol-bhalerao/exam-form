import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const u = await p.user.findMany();
  console.log(u);
  await p.$disconnect();
}
run();
