#!/usr/bin/env node

/**
 * Database Connection Test
 * Tests connection to Hostinger MySQL from local machine
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔌 Testing Hostinger MySQL connection...\n');
    console.log('Connection String:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Try to query database
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('\n✅ SUCCESS: Connected to Hostinger MySQL!');
    console.log('Result:', result);
    
    // Try to fetch student count
    const studentCount = await prisma.student.count();
    console.log(`\n📊 Found ${studentCount} students in database`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify password from Hostinger cPanel (Databases → Users)');
    console.error('2. Confirm remote access is enabled (set to "Any Host")');
    console.error('3. Firewall: Check if your ISP blocks port 3306');
    console.error('4. Test with: mysql -h 194.59.164.55 -u u441114691_exam -p');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
