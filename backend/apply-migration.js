#!/usr/bin/env node
/**
 * Direct migration applier for percentage column
 */

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('📊 Checking database migration status...\n');

    // Test connection
    console.log('Testing MySQL connection...');
    const connectionTest = await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Connected to MySQL\n');

    // Check if column exists
    console.log('Checking for percentage column in previous_exams...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'previous_exams'
      AND COLUMN_NAME = 'percentage'
    `;

    if (columns && columns.length > 0) {
      console.log('✓ Percentage column already exists!\n');
    } else {
      console.log('⚠ Percentage column missing - adding it now...\n');
      
      // Add the column
      await prisma.$queryRaw`
        ALTER TABLE previous_exams
        ADD COLUMN percentage VARCHAR(10) NULL
      `;
      
      console.log('✓ Percentage column added successfully!\n');
    }

    // Show table structure
    console.log('📋 Current previous_exams table structure:');
    const schema = await prisma.$queryRaw`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'previous_exams'
      ORDER BY ORDINAL_POSITION
    `;

    console.log('');
    schema.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? '(nullable)' : '(required)';
      console.log(`  • ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable}`);
    });

    console.log('\n✅ Migration check complete!\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
