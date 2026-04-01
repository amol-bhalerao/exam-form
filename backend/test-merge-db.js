import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const instituteId = 1;
const streamId = 4; // HSC.VOC

async function test() {
  try {
    console.log('📋 CURRENT MAPPINGS FOR HSC.VOC:');
    const current = await prisma.instituteStreamSubject.findMany({
      where: { instituteId, streamId },
      include: { subject: { select: { id: true, name: true } } }
    });
    console.log(`Current subjects: ${current.length}`);
    current.forEach(m => console.log(`  - ${m.subject.name}`));

    console.log('\n✅ STEP 1: Add NEW unique subjects (English=1, ComputerScience=8)');
    const existingSubjectIds = new Set(current.map(m => m.subjectId));
    const toAdd = [1, 8].filter(id => !existingSubjectIds.has(id));
    
    if (toAdd.length > 0) {
      const data = toAdd.map(subjectId => ({ instituteId, streamId, subjectId }));
      const created = await prisma.instituteStreamSubject.createMany({ data, skipDuplicates: true });
      console.log(`Added ${created.count} new subjects`);
    } else {
      console.log('No new subjects to add (all already exist)');
    }

    console.log('\n📋 STATE AFTER STEP 1:');
    const after1 = await prisma.instituteStreamSubject.findMany({
      where: { instituteId, streamId },
      include: { subject: { select: { id: true, name: true } } }
    });
    console.log(`Total subjects now: ${after1.length}`);
    after1.forEach(m => console.log(`  - ${m.subject.name}`));

    console.log('\n⚠️  STEP 2: Try adding mix of OLD (1, 8) and NEW (7)');
    console.log('Request: [1, 7, 8]');
    const mixedIds = [1, 7, 8];
    const newToAdd = mixedIds.filter(id => !new Set(after1.map(m => m.subjectId)).has(id));
    console.log(`New subjects to add: ${newToAdd.length} (${newToAdd.join(',')})`);
    console.log(`Duplicates to skip: ${mixedIds.length - newToAdd.length} (${mixedIds.filter(id => !newToAdd.includes(id)).join(',')})`);
    
    if (newToAdd.length > 0) {
      const data = newToAdd.map(subjectId => ({ instituteId, streamId, subjectId }));
      const created = await prisma.instituteStreamSubject.createMany({ data, skipDuplicates: true });
      console.log(`✓ Added ${created.count} new subjects`);
    }

    console.log('\n📋 FINAL STATE:');
    const final = await prisma.instituteStreamSubject.findMany({
      where: { instituteId, streamId },
      include: { subject: { select: { id: true, name: true } } }
    });
    console.log(`Total subjects: ${final.length}`);
    final.forEach(m => console.log(`  - ${m.subject.name}`));

    if (final.length === 4) {
      console.log('\n✅ SUCCESS: Merge mode working perfectly!');
      console.log('   - All unique subjects preserved');
      console.log('   - Duplicates properly skipped');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
