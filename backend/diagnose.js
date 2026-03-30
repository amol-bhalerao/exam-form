#!/usr/bin/env node
/**
 * HSC Exam - System Diagnostic
 * Check current state of backend and database without making changes
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

function check(name, condition, details = '') {
  const icon = condition ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const status = condition ? `${GREEN}OK${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`${icon} ${name.padEnd(40)} ${status} ${details}`);
  return condition;
}

function section(title) {
  console.log(`\n${BLUE}${'='.repeat(70)}${RESET}`);
  console.log(`${BLUE}  ${title}${RESET}`);
  console.log(`${BLUE}${'='.repeat(70)}${RESET}\n`);
}

async function checkDB() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ errorFormat: 'minimal' });

    try {
      // Test connection
      await prisma.$queryRaw`SELECT 1`;

      // Check percentage column
      const columns = await prisma.$queryRaw`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'previous_exams'
        AND COLUMN_NAME = 'percentage'
      `;

      await prisma.$disconnect();
      return {
        connected: true,
        hasPercentageColumn: columns && columns.length > 0
      };
    } catch (err) {
      await prisma.$disconnect();
      return {
        connected: false,
        error: err.message
      };
    }
  } catch (err) {
    return {
      connected: false,
      error: 'Prisma client not available'
    };
  }
}

async function main() {
  console.clear();
  console.log(`\n${BLUE}╔═══════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BLUE}║         HSC Exam - System Diagnostic & Status Report             ║${RESET}`);
  console.log(`${BLUE}╚═══════════════════════════════════════════════════════════════════╝${RESET}\n`);

  // Section 1: System Requirements
  section('System Requirements');

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    check('Node.js', true, nodeVersion);
  } catch {
    check('Node.js', false, 'Not found');
  }

  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    check('NPM', true, npmVersion);
  } catch {
    check('NPM', false, 'Not found');
  }

  // Section 2: Project Files
  section('Project Files');

  check('Backend folder', fs.existsSync(path.join(__dirname)));
  check('.env file', fs.existsSync(path.join(__dirname, '.env')));
  check('.env.development', fs.existsSync(path.join(__dirname, '.env.development')));
  check('package.json', fs.existsSync(path.join(__dirname, 'package.json')));
  check('Prisma schema', fs.existsSync(path.join(__dirname, 'prisma', 'schema.prisma')));

  // Section 3: Dependencies
  section('Dependencies');

  const nodeModulesPath = path.join(__dirname, 'node_modules');
  check('node_modules', fs.existsSync(nodeModulesPath), `${fs.readdirSync(nodeModulesPath || '.').length || 0} packages`);
  check('@prisma/client', fs.existsSync(path.join(nodeModulesPath, '@prisma')));
  check('express', fs.existsSync(path.join(nodeModulesPath, 'express')));
  check('jsonwebtoken', fs.existsSync(path.join(nodeModulesPath, 'jsonwebtoken')));

  // Section 4: Build Status
  section('Build Status');

  const distExists = fs.existsSync(path.join(__dirname, 'dist'));
  check('dist/ folder', distExists);
  if (distExists) {
    const distFiles = fs.readdirSync(path.join(__dirname, 'dist')).length;
    console.log(`${GREEN}  └─${RESET} Contains ${distFiles} files`);
  }

  // Section 5: Database Status
  section('Database Status');

  const db = await checkDB();
  
  if (db.connected) {
    check('MySQL Connection', true);
    check('Percentage Column', db.hasPercentageColumn, 
      db.hasPercentageColumn ? 'Already exists' : 'Missing (needs fix)');
  } else {
    check('MySQL Connection', false, db.error);
    check('Percentage Column', false, 'Cannot check (DB not connected)');
  }

  // Section 6: Configuration Files
  section('Configuration Check');

  const envPath = path.join(__dirname, '.env.development');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const hasDB = content.includes('DATABASE_URL');
    const hasJWT = content.includes('JWT_ACCESS_SECRET');
    
    check('DATABASE_URL configured', hasDB);
    check('JWT_ACCESS_SECRET configured', hasJWT);
  }

  // Section 7: Ready for Commands
  section('Ready For These Commands');

  console.log(`${BLUE}Run these from the backend folder:${RESET}\n`);
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`  ${YELLOW}Priority: npm install${RESET}`);
  }
  if (!db.hasPercentageColumn) {
    console.log(`  ${YELLOW}Priority: node fix-schema.js${RESET}`);
  }
  if (!distExists) {
    console.log(`  ${YELLOW}Priority: npm run build${RESET}`);
  }

  console.log(`\n  ${GREEN}After fixes: npm start${RESET}`);

  // Summary
  section('Summary');

  const issues = [];
  if (!fs.existsSync(nodeModulesPath)) issues.push('Dependencies not installed');
  if (!db.hasPercentageColumn) issues.push('Percentage column missing from database');
  if (!distExists) issues.push('Application not built');
  if (!db.connected) issues.push('Cannot connect to MySQL');

  if (issues.length === 0) {
    console.log(`${GREEN}✓ All systems operational!${RESET}`);
    console.log(`\nYou can run: npm start\n`);
  } else {
    console.log(`${RED}⚠ ${issues.length} issue(s) found:${RESET}\n`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log(`\nRun: npm install && node fix-schema.js && npm run build\n`);
  }

  // Footer
  console.log(`${BLUE}${'='.repeat(70)}${RESET}`);
  console.log(`${BLUE}For detailed fix instructions, see: COMPLETE_FIX_GUIDE.md${RESET}`);
  console.log(`${BLUE}${'='.repeat(70)}\n${RESET}`);
}

main().catch(err => {
  console.error(`${RED}Error:${RESET}`, err.message);
  process.exit(1);
});
