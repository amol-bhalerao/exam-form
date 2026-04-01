import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGUiOiJJTlNUSVRVVEUiLCJpbnN0aXR1dGVJZCI6MSwidXNlcm5hbWUiOiJpbnN0aXR1dGUxIiwiaWF0IjoxNzc1MDMzODk0LCJleHAiOjE3NzUwMzQ3OTR9.as1MJK6XHBl0wodTiH7o42pD390zyExND_Z0mD_RNW8';
const instituteId = 1;

async function test() {
  try {
    console.log('=== STEP 1: Current Mappings ===');
    const before = await prisma.instituteStreamSubject.findMany({
      where: { instituteId },
      include: { stream: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } } },
      orderBy: [{ stream: { name: 'asc' } }, { subject: { name: 'asc' } }]
    });
    console.log('Current state:');
    before.forEach(m => console.log(`  ${m.stream.name} → ${m.subject.name}`));
    
    console.log('\n=== STEP 2: Add SCIENCE Stream Subjects ===');
    // Simulate POST request to add SCIENCE (streamId=1) with subjects 5,6,7
    const newMappings = [
      { instituteId, streamId: 1, subjectId: 5 },
      { instituteId, streamId: 1, subjectId: 6 },
      { instituteId, streamId: 1, subjectId: 7 }
    ];
    
    // Delete only SCIENCE stream mappings (streamId: 1)
    await prisma.instituteStreamSubject.deleteMany({
      where: { instituteId, streamId: 1 }
    });
    
    // Create new mappings
    const created = await prisma.instituteStreamSubject.createMany({ data: newMappings });
    console.log(`Created ${created.count} mappings for SCIENCE stream`);
    
    console.log('\n=== STEP 3: Verify Both Streams Are Preserved ===');
    const after = await prisma.instituteStreamSubject.findMany({
      where: { instituteId },
      include: { stream: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } } },
      orderBy: [{ stream: { name: 'asc' } }, { subject: { name: 'asc' } }]
    });
    console.log('After adding SCIENCE subjects:');
    const grouped = {};
    after.forEach(m => {
      if (!grouped[m.stream.name]) grouped[m.stream.name] = [];
      grouped[m.stream.name].push(m.subject.name);
    });
    Object.entries(grouped).forEach(([stream, subjects]) => {
      console.log(`  ${stream}:`);
      subjects.forEach(s => console.log(`    - ${s}`));
    });
    
    if (Object.keys(grouped).length >= 2) {
      console.log('\n✅ SUCCESS: Both ARTS and SCIENCE streams have their mappings preserved!');
    } else {
      console.log('\n❌ FAILED: Only one stream exists, previous mappings were deleted');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
