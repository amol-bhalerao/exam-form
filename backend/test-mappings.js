import { prisma } from './src/prisma.js';

async function checkMappings() {
  try {
    console.log('Checking institutei 1 mappings...');
    
    const mappings = await prisma.instituteStreamSubject.findMany({
      where: { instituteId: 1 },
      include: {
        stream: true,
        subject: true
      }
    });
    
    console.log(`Found ${mappings.length} mappings:`);
    console.log(JSON.stringify(mappings, null, 2));
    
    // Also check raw count
    const count = await prisma.instituteStreamSubject.count({
      where: { instituteId: 1 }
    });
    console.log(`Raw count: ${count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkMappings();
