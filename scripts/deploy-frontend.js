#!/usr/bin/env node
/**
 * Frontend Deployment Script
 * Deploys the built frontend directly to Hostinger public_html via SFTP
 */

const fs = require('fs');
const path = require('path');
const Client = require('ssh2').Client;
const { execSync } = require('child_process');

const config = {
  host: process.env.SSH_HOST || '45.130.228.77',
  port: parseInt(process.env.SSH_PORT || '65002'),
  username: process.env.SSH_USER || 'u441114691',
  remotePath: '/home/u441114691/public_html'
};

const buildPath = 'frontend/dist/exam-form/browser';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(message, 'red');
  process.exit(1);
}

async function deployFrontend() {
  // Verify build exists
  if (!fs.existsSync(buildPath)) {
    error(`❌ Build directory not found: ${buildPath}\n   Run: npm run build:frontend:local`);
  }

  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log('  HSC Exam Frontend Deployment Script', 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  log('✓ Build directory found', 'green');
  log(`  Source: ${buildPath}`, 'gray');
  log(`  Destination: ${config.username}@${config.host}:${config.remotePath}\n`, 'gray');

  // List files
  log('Files to deploy:', 'yellow');
  const files = getAllFiles(buildPath);
  files.forEach(file => {
    const relativePath = path.relative(buildPath, file);
    log(`  • ${relativePath}`, 'gray');
  });

  log('\nConnecting to server...', 'cyan');
  log('(If prompted for password, enter your Hostinger SSH password)\n', 'yellow');

  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        uploadRecursive(sftp, buildPath, config.remotePath, (uploadErr) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            log('✓ Upload completed successfully!', 'green');
            log('\nNext steps:', 'cyan');
            log('  1. Clear browser cache (Ctrl+Shift+Delete)', 'gray');
            log('  2. Visit: https://hsc-exam-form.hisofttechnology.com/', 'gray');
            log('  3. Check browser console (F12) for errors\n', 'gray');
            resolve();
          }
          conn.end();
        });
      });
    });

    conn.on('close', () => {
      resolve();
    });

    conn.on('error', (err) => {
      reject(err);
    });

    // Try prompt-based password authentication
    log('Note: Using keyboard-interactive authentication', 'gray');
    log('Password will be prompted by SSH client\n', 'gray');

    // Use spawn to allow interactive password input
    const { spawn } = require('child_process');
    const scp = spawn('scp', [
      '-P', config.port.toString(),
      '-r',
      `${buildPath}/*`,
      `${config.username}@${config.host}:${config.remotePath}/`
    ]);

    let scpError = '';
    scp.stderr.on('data', (data) => {
      scpError += data.toString();
    });

    scp.on('close', (code) => {
      if (code === 0) {
        log('✓ Upload completed successfully!', 'green');
        log('\nNext steps:', 'cyan');
        log('  1. Clear browser cache (Ctrl+Shift+Delete)', 'gray');
        log('  2. Visit: https://hsc-exam-form.hisofttechnology.com/', 'gray');
        log('  3. Check browser console (F12) for errors\n', 'gray');
      } else {
        error(`❌ SCP failed with exit code ${code}: ${scpError}`);
      }
    });
  });
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function uploadRecursive(sftp, localDir, remoteDir, callback) {
  const files = fs.readdirSync(localDir);
  let completed = 0;
  let hasError = false;

  if (files.length === 0) {
    callback(null);
    return;
  }

  files.forEach(file => {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      sftp.mkdir(remotePath, () => {
        uploadRecursive(sftp, localPath, remotePath, (err) => {
          if (err) hasError = true;
          if (++completed === files.length && !hasError) {
            callback(null);
          }
        });
      });
    } else {
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          hasError = true;
          log(`  ✗ ${file}`, 'red');
        } else {
          log(`  ✓ ${file}`, 'green');
        }
        
        if (++completed === files.length) {
          callback(hasError ? new Error('Upload failed') : null);
        }
      });
    }
  });
}

// Run deployment using SCP for simplicity
const { spawn } = require('child_process');

log('═══════════════════════════════════════════════════════════════', 'cyan');
log('  HSC Exam Frontend Deployment Script', 'cyan');
log('═══════════════════════════════════════════════════════════════\n', 'cyan');

log('✓ Build directory found', 'green');
log(`  Source: ${buildPath}`, 'gray');
log(`  Destination: ${config.username}@${config.host}:${config.remotePath}\n`, 'gray');

log('Files to deploy:', 'yellow');
const files = getAllFiles(buildPath);
files.forEach(file => {
  const relativePath = path.relative(buildPath, file);
  log(`  • ${relativePath}`, 'gray');
});

log('\nUploading files...', 'cyan');
log('(Enter your SSH password when prompted)\n', 'yellow');

const scp = spawn('scp', [
  '-P', config.port.toString(),
  '-r',
  `${buildPath}/*`,
  `${config.username}@${config.host}:${config.remotePath}/`
], { stdio: 'inherit' });

scp.on('close', (code) => {
  if (code === 0) {
    log('\n✓ Upload completed successfully!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Clear browser cache (Ctrl+Shift+Delete)', 'gray');
    log('  2. Visit: https://hsc-exam-form.hisofttechnology.com/', 'gray');
    log('  3. Check browser console (F12) for errors\n', 'gray');
    process.exit(0);
  } else {
    log(`\n❌ SCP failed with exit code ${code}`, 'red');
    process.exit(1);
  }
});
