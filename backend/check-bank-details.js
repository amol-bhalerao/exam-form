import { prisma } from './src/prisma.js';

try {
  const bankDetails = await prisma.feeReimbursement.findUnique({
    where: { studentId: 3 }
  });

  console.log('Bank Details from Database:');
  console.log(JSON.stringify(bankDetails, null, 2));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await prisma.$disconnect();
}
