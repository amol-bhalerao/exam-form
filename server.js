#!/usr/bin/env node

/**
 * Root server that starts the backend application
 * This file allows Hostinger to detect a valid Node.js app at the repository root
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting HSC Exam Form Backend...');
console.log('Backend directory:', path.join(__dirname, 'backend'));

// Spawn the backend Node.js server
const backend = spawn('node', ['dist/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  env: { ...process.env }
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  backend.kill();
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  backend.kill();
});
