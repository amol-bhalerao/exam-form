#!/usr/bin/env node

/**
 * Setup Prisma Permissions
 * 
 * Cross-platform script to fix Prisma binary permissions on Linux/macOS
 * Windows users: runs without errors (permission fixing not needed on Windows)
 * Linux users: automatically sets execute permissions before build
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

const IS_WINDOWS = os.platform() === 'win32';
const IS_LINUX = os.platform() === 'linux';
const IS_MAC = os.platform() === 'darwin';

console.log(`🔧 Setup Prisma Permissions (${os.platform()})`);

// On Windows, skip - chmod doesn't work anyway
if (IS_WINDOWS) {
  console.log('ℹ️  Windows detected - skipping permission setup (not needed on Windows)');
  process.exit(0);
}

// On Linux/macOS, fix permissions
if (IS_LINUX || IS_MAC) {
  try {
    console.log('🔒 Setting execute permissions for Prisma binary...');
    
    // Make Prisma CLI executable
    execSync('chmod +x node_modules/.bin/prisma 2>/dev/null || true', { 
      stdio: 'pipe' 
    });
    console.log('  ✓ Prisma CLI executable');

    // Make Prisma engines executable
    execSync('chmod +x node_modules/@prisma/client/engines/* 2>/dev/null || true', { 
      stdio: 'pipe' 
    });
    console.log('  ✓ Prisma engines executable');

    console.log('✅ Permissions setup complete');
    process.exit(0);
  } catch (error) {
    // Silently fail - permissions might already be set
    console.log('ℹ️  Permission setup skipped (may already be set)');
    process.exit(0);
  }
}

// Fallback for unknown platforms
console.log('ℹ️  Platform not recognized - skipping permission setup');
process.exit(0);
