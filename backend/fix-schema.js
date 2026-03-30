#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database schema...\n');

    // Test connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Connection successful\n');

    // Check percentage column
    console.log('Checking for percentage column in previous_exams...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'previous_exams'
      ORDER BY ORDINAL_POSITION
    `;

    const hasPercentageColumn = columns.some((col) => col.COLUMN_NAME === 'percentage');

    if (hasPercentageColumn) {
      console.log('✓ Percentage column already exists\n');
    } else {
      console.log('✗ Percentage column not found');
      console.log('  Adding percentage column...\n');

      await prisma.$executeRawUnsafe(`
        ALTER TABLE previous_exams ADD COLUMN percentage VARCHAR(10) NULL
      `);

      console.log('✓ Percentage column added successfully\n');
    }

    // Display schema
    console.log('Current previous_exams schema:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    columns.forEach((col) => {
      const isnew = col.COLUMN_NAME === 'percentage' && !hasPercentageColumn ? ' ← NEW' : '';
      console.log(`${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE}${isnew}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Schema verification complete!\n');
    console.log('Next steps:');
    console.log('  1. npx prisma generate');
    console.log('  2. npm run build');
    console.log('  3. npm start\n');

  } catch (error) {
    console.error('❌ Error:', error.message, '\n');

    if (error.message.includes('ECONNREFUSED') || error.message.includes('PROTOCOL_CONNECTION_LOST')) {
      console.error('Please ensure MySQL is running on localhost:3306\n');
      console.error('To start MySQL:');
      console.error('  Windows: net start MySQL80  (or your MySQL service name)');
      console.error('  Mac:     brew services start mysql');
      console.error('  Linux:   sudo systemctl start mysql\n');
    } else if (error.message.includes('ER_NO_DB_ERROR')) {
      console.error('Database not found. Check DATABASE_URL in .env.development\n');
    } else if (error.message.includes('ER_ACCESS_DENIED')) {
      console.error('Database access denied. Check credentials in .env.development\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
