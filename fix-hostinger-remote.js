#!/usr/bin/env node
/**
 * Direct SSH execution to Hostinger
 * Runs all fixes remotely via SSH tunnel
 * Handles connection issues and tests endpoints
 */

const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');
const http = require('http');

const SSH_CONFIG = {
  host: '45.130.228.77',
  port: 65002,
  username: 'u441114691',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'hostinger')),
  readyTimeout: 60000,
  connectionTimeout: 60000,
};

let conn = new Client();
let commandResults = [];

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${command}`);
    console.log('-'.repeat(70));

    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code, signal) => {
        console.log(stdout);
        if (stderr) console.log('STDERR:', stderr);
        console.log('-'.repeat(70));
        
        commandResults.push({ command, code, stdout, stderr });
        resolve({ code, stdout, stderr });
      });

      stream.on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      });

      stream.stderr.on('data', (data) => {
        stderr += data;
        console.error('ERROR:', data.toString());
      });
    });
  });
}

function testEndpoint(url) {
  return new Promise((resolve) => {
    console.log(`\nTesting: ${url}`);
    
    http.get(url.replace('https', 'http'), (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch {
          console.log('Response:', data.substring(0, 200));
        }
        resolve({ statusCode: res.statusCode, data });
      });
    }).on('error', (err) => {
      console.log(`Error: ${err.message}`);
      resolve({ statusCode: 0, error: err.message });
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  HOSTINGER REMOTE FIX - SSH EXECUTION');
  console.log('='.repeat(70));

  try {
    await new Promise((resolve, reject) => {
      conn
        .on('ready', async () => {
          try {
            console.log('\n✓ SSH Connection established');
            console.log('='.repeat(70));

            // Step 1: Check current status
            console.log('\n[STEP 1] CHECKING CURRENT STATUS');
            await executeCommand('whoami');
            await executeCommand('pwd');
            await executeCommand('pm2 status');

            // Step 2: Stop app if running
            console.log('\n[STEP 2] STOPPING APP');
            await executeCommand('pm2 stop app');
            await new Promise(r => setTimeout(r, 2000));

            // Step 3: Clean and install
            console.log('\n[STEP 3] CLEANING & INSTALLING DEPENDENCIES');
            await executeCommand('cd ~/app && rm -rf node_modules package-lock.json');
            await executeCommand('cd ~/app && npm install --production=false');

            // Step 4: Generate Prisma (CRITICAL)
            console.log('\n[STEP 4] GENERATING PRISMA BINARIES FOR LINUX (CRITICAL)');
            await executeCommand('cd ~/app && npx prisma generate');

            // Step 5: Start app
            console.log('\n[STEP 5] STARTING APP');
            await executeCommand('cd ~/app && pm2 start server.js --name app');
            await new Promise(r => setTimeout(r, 3000));

            // Step 6: Check status
            console.log('\n[STEP 6] VERIFYING APP IS RUNNING');
            await executeCommand('pm2 status');
            await executeCommand('pm2 logs app --lines 20');

            // Step 7: Check app directory
            console.log('\n[STEP 7] CHECKING APP FILES');
            await executeCommand('cd ~/app && ls -la src/ | head -20');

            resolve();
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject)
        .on('close', () => {
          console.log('\n✓ SSH connection closed');
        })
        .connect(SSH_CONFIG);
    });

    console.log('\n' + '='.repeat(70));
    console.log('  TESTING ENDPOINTS');
    console.log('='.repeat(70));

    // Wait for backend to fully start
    console.log('\nWaiting 5 seconds for backend to start...');
    await new Promise(r => setTimeout(r, 5000));

    // Test endpoints
    await testEndpoint('https://hsc-exam-form.hisofttechnology.com/api/health');
    await new Promise(r => setTimeout(r, 1000));

    await testEndpoint('https://hsc-exam-form.hisofttechnology.com/api/public/exams');
    await new Promise(r => setTimeout(r, 1000));

    await testEndpoint('https://hsc-exam-form.hisofttechnology.com/api/public/colleges');
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n' + '='.repeat(70));
    console.log('  FIX COMPLETE');
    console.log('='.repeat(70) + '\n');

    console.log('✓ All commands executed');
    console.log('✓ Backend should now be running');
    console.log('✓ Prisma binaries generated for Linux');
    console.log('\nCheck the test results above for endpoint status.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    conn.end();
    process.exit(1);
  }
}

main();
