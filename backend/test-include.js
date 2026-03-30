import { prisma } from './src/prisma.js';

try {
  const student = await prisma.student.findUnique({
    where: { id: 3 },
    include: {
      feeReimbursement: true
    }
  });

  console.log('Student with feeReimbursement include:');
  console.log(JSON.stringify(student, null, 2));
  
  if (student?.feeReimbursement) {
    console.log('\n✅ Bank details found!');
  } else {
    console.log('\n❌ Bank details NOT included');
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await prisma.$disconnect();
}
