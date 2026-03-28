#!/usr/bin/env node
/**
 * Smart build script that detects deployment context
 * - If backend: build backend (Prisma generate)
 * - If frontend: build frontend (Angular build)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Detect deployment context
const detectDeployment = () => {
  // Check if we're in backend directory
  if (process.cwd().includes('backend') || fs.existsSync(path.join(process.cwd(), 'prisma'))) {
    return 'backend';
  }
  
  // Check environment variable
  if (process.env.BUILD_TARGET === 'backend') {
    return 'backend';
  }
  
  // Check NODE_ENV and other hints
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    return 'backend';
  }
  
  // Default to frontend
  return 'frontend';
};

const deployment = detectDeployment();

console.log(`🔨 Detected deployment: ${deployment}`);

try {
  if (deployment === 'backend') {
    console.log('📦 Building backend (Prisma generate)...');
    execSync('cd backend && npm run build', { stdio: 'inherit' });
    console.log('✅ Backend build complete');
  } else {
    console.log('📦 Building frontend (Angular)...');
    execSync('npm run build:frontend:local', { stdio: 'inherit' });
    console.log('✅ Frontend build complete');
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
