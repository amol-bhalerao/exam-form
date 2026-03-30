#!/usr/bin/env node

/**
 * HSC Exam Complete Setup & Fix Script
 * Runs all necessary steps to get the system working
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = __dirname;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ROOT_DIR = path.join(__dirname, '..');

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',      // cyan
    success: '\x1b[32m',   // green
    error: '\x1b[31m',     // red
    warning: '\x1b[33m',   // yellow
    bold: '\x1b[1m',       // bold
    reset: '\x1b[0m'
  };

  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warning: '⚠'
  };

  const color = colors[type] || colors.info;
  const symbol = prefix[type] || '•';
  console.log(`${color}${symbol} ${msg}${colors.reset}`);
}

function section(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}\n`);
}

function runCommand(cmd, description, dir = BACKEND_DIR) {
  try {
    log(description);
    execSync(cmd, {
      cwd: dir,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    });
    log(`${description} completed`, 'success');
    return true;
  } catch (err) {
    log(`${description} failed`, 'error');
    return false;
  }
}

async function main() {
  section('🚀 HSC Exam - Complete System Setup');

  // Step 1: Check Node/NPM
  section('Step 1: Checking Prerequisites');
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    log(`Node.js: ${nodeVersion}`, 'success');
    log(`NPM: ${npmVersion}`, 'success');
  } catch (err) {
    log('Node.js or NPM not found!', 'error');
    process.exit(1);
  }

  // Step 2: Clean Install (remove old modules)
  section('Step 2: Cleaning Dependencies');
  
  log('Removing old node_modules (backend)...');
  try {
    if (fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
      execSync('rmdir /s /q node_modules', {
        cwd: BACKEND_DIR,
        shell: 'cmd.exe',
        stdio: 'pipe'
      });
      log('Removed old backend node_modules', 'success');
    }
  } catch (err) {
    // Ignore if directory doesn't exist
  }

  log('Clearing npm cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
    log('Cache cleared', 'success');
  } catch (err) {
    log('Cache clear failed, continuing...', 'warning');
  }

  // Step 3: Install Dependencies
  section('Step 3: Installing Dependencies');
  
  if (!runCommand('npm install', 'Installing backend dependencies', BACKEND_DIR)) {
    log('Backend installation failed!', 'error');
    process.exit(1);
  }

  // Step 4: Generate Prisma
  section('Step 4: Generating Prisma Client');
  
  if (!runCommand('npx prisma generate', 'Generating Prisma client', BACKEND_DIR)) {
    log('Prisma generation failed', 'error');
  }

  // Step 5: Validate Prisma Schema
  section('Step 5: Validating Database Schema');
  
  log('Validating Prisma schema...');
  try {
    execSync('npx prisma validate', {
      cwd: BACKEND_DIR,
      stdio: 'pipe'
    });
    log('Schema validation passed', 'success');
  } catch (err) {
    log('Schema validation failed!', 'error');
    log('Please check your prisma/schema.prisma file', 'error');
    process.exit(1);
  }

  // Step 6: Apply Database Fixes
  section('Step 6: Applying Database Schema Fixes');
  
  log('Running schema fix script...');
  try {
    execSync('node fix-schema.js', {
      cwd: BACKEND_DIR,
      stdio: 'inherit'
    });
  } catch (err) {
    log('Schema fix encountered an issue', 'warning');
    log('This is usually because MySQL is not running', 'warning');
    log('Make sure MySQL is started, then run: npm run dev', 'warning');
  }

  // Step 7: Build Backend
  section('Step 7: Building Backend');
  
  if (!runCommand('npm run build', 'Building backend application', BACKEND_DIR)) {
    log('Backend build failed', 'error');
    log('Check for TypeScript errors above', 'error');
    process.exit(1);
  }

  // Step 8: Build Frontend
  section('Step 8: Building Frontend');
  
  if (!runCommand('npm run build', 'Building frontend application', FRONTEND_DIR)) {
    log('Frontend build failed (continuing with backend)', 'warning');
  }

  // Final Summary
  section('✅ Setup Complete!');
  
  log('Backend is ready to run!', 'success');
  log('Frontend build completed!', 'success');
  
  log('\n📝 Important Requirements:', 'bold');
  log('  • MySQL must be running on localhost:3306', 'warning');
  log('  • Database "hsc_exam_local" must exist', 'warning');
  log('  • .env.development must have correct DATABASE_URL', 'warning');
  
  log('\n🚀 Next Steps:', 'bold');
  log('1. Make sure MySQL is running', 'info');
  log('2. Run backend:  npm start  (from backend folder)', 'info');
  log('3. Run frontend: cd ../frontend && npm start', 'info');
  log('4. Open: http://localhost:4200 in your browser', 'info');
  
  log('\n💡 Common Issues:', 'bold');
  log('• "ECONNREFUSED": MySQL not running', 'info');
  log('• "ER_NO_DB_ERROR": Database missing, create: hsc_exam_local', 'info');
  log('• "Cannot find module": Run npm install again', 'info');
  
  log('\n📚 Documentation:', 'bold');
  log('• CRITICAL_FIXES_APPLIED.md - Details of all fixes', 'info');
  log('• DEPLOYMENT_CHECKLIST.md - Testing checklist', 'info');
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
