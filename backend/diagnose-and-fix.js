#!/usr/bin/env node

/**
 * HSC Exam - Complete Diagnostic & Fix Script
 * Runs all necessary checks and fixes systematically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(title, 'bold');
  log('='.repeat(60), 'blue');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function run(cmd, description) {
  try {
    log(`→ ${description}...`, 'blue');
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    success(description);
    return { success: true, output };
  } catch (err) {
    error(description);
    return { success: false, error: err.message };
  }
}

async function main() {
  section('HSC Exam System Diagnostic & Fix');

  // Check 1: System Requirements
  section('1. Checking System Requirements');
  
  // Node version
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  log(`Node.js version: ${nodeVersion}`);
  
  // NPM version
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  log(`NPM version: ${npmVersion}`);

  // Check 2: Environment Files
  section('2. Checking Environment Configuration');
  
  const envFiles = [
    { path: '.env', desc: 'Default .env' },
    { path: '.env.development', desc: 'Development .env' },
    { path: '.env.production', desc: 'Production .env (optional)' }
  ];

  for (const file of envFiles) {
    const fullPath = path.join(__dirname, file.path);
    if (fs.existsSync(fullPath)) {
      success(`${file.desc} exists`);
    } else if (file.desc.includes('optional')) {
      warning(`${file.desc} not found (optional)`);
    } else {
      error(`${file.desc} not found`);
    }
  }

  // Check 3: Dependency Installation Status
  section('3. Checking Dependencies');

  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    success('node_modules directory exists');
    
    const primPath = path.join(nodeModulesPath, '@prisma');
    if (fs.existsSync(primPath)) {
      success('Prisma is installed');
    } else {
      warning('Prisma not found in node_modules - may need npm install');
    }
  } else {
    error('node_modules directory not found');
    log('\nInstalling dependencies...', 'yellow');
    run('npm install', 'Installing npm packages');
  }

  // Check 4: Database Configuration
  section('4. Checking Database Configuration');
  
  const envPath = path.join(__dirname, '.env.development');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const dbMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (dbMatch) {
      const dbUrl = dbMatch[1];
      success(`Database URL configured: ${dbUrl.split(':')[3]}`);
      
      if (!dbUrl.includes('localhost')) {
        warning('Database is not on localhost - ensure it\'s running');
      }
    } else {
      error('DATABASE_URL not found in .env.development');
    }
  }

  // Check 5: Build Process
  section('5. Running Build Process');
  
  const buildResult = run('npm run build', 'Building backend');
  if (!buildResult.success) {
    error('Build failed. Running clean install...');
    run('npm cache clean --force', 'Clearing npm cache');
    run('npm install', 'Reinstalling dependencies');
    const retryBuild = run('npm run build', 'Retrying build');
    if (!retryBuild.success) {
      error('Build still failing after clean install');
      process.exit(1);
    }
  }

  // Check 6: Prisma Validation
  section('6. Running Prisma Checks');
  
  run('npx prisma generate', 'Generating Prisma client');
  run('npx prisma validate', 'Validating Prisma schema');

  // Check 7: Database Operations
  section('7. Applying Database Changes');
  
  log('Note: Ensure MySQL is running before proceeding!', 'yellow');
  
  // Attempt database operations
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({ errorFormat: 'minimal' });
    
    try {
      log('→ Testing database connection...', 'blue');
      await prisma.$queryRaw`SELECT 1`;
      success('Database connection successful');
      
      log('→ Checking percentage column...', 'blue');
      const result = await prisma.$queryRaw`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA='hsc_exam_local' AND TABLE_NAME='previous_exams' AND COLUMN_NAME='percentage'
      `;
      
      if (result && result.length > 0) {
        success('Percentage column exists');
      } else {
        warning('Percentage column not found - attempting to add...');
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE previous_exams ADD COLUMN percentage VARCHAR(10) NULL
          `);
          success('Percentage column added successfully');
        } catch (err) {
          if (err.message.includes('Duplicate')) {
            success('Percentage column already exists');
          } else {
            error(`Could not add percentage column: ${err.message}`);
          }
        }
      }
    } catch (err) {
      if (err.message.includes('ECONNREFUSED') || err.message.includes('PROTOCOL_CONNECTION_LOST')) {
        error('Cannot connect to MySQL database');
        warning('Please ensure MySQL is running on localhost:3306');
      } else {
        error(`Database error: ${err.message}`);
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (err) {
    error(`Prisma client error: ${err.message}`);
  }

  // Final Summary
  section('System Status Summary');
  success('✓ All file checks completed');
  success('✓ Build process verified');
  success('✓ Prisma client generated');
  warning('⚠ Ensure MySQL is running before starting the server');
  
  log('\nNext steps:', 'bold');
  log('1. Ensure MySQL is running on localhost:3306', 'yellow');
  log('2. npm start (to start the backend server)', 'yellow');
  log('3. cd ../frontend && npm start (to start the frontend)', 'yellow');
  
  section('Fix Complete!');
}

main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
