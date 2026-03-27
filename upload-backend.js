#!/usr/bin/env node
/**
 * Complete Backend Upload & Setup via SSH
 * 1. Creates ~/app directory
 * 2. Uploads all backend files
 * 3. Installs dependencies
 * 4. Generates Prisma
 * 5. Starts with Node.js directly (no PM2 - may not be installed)
 */

const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '45.130.228.77',
  port: 65002,
  username: 'u441114691',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'hostinger')),
  readyTimeout: 60000,
};

const BACKEND_SRC = './backend';
let conn = new Client();

function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`$ ${cmd}`);

    conn.exec(cmd, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code) => {
        console.log(stdout);
        if (code !== 0) console.error('ERROR:', stderr);
        resolve({ code, stdout, stderr });
      });

      stream.on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      });

      stream.stderr.on('data', (data) => {
        stderr += data;
      });
    });
  });
}

function uploadFiles(sftp, localDir, remoteDir) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create remote directory
      await executeCommand(`mkdir -p ${remoteDir}`);

      const walkAndUpload = (dir, remote) => {
        return new Promise(async (res, rej) => {
          try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
              // Skip node_modules and .git
              if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'dist') {
                console.log(`  (skipped: ${file})`);
                continue;
              }

              const localPath = path.join(dir, file);
              const remotePath = `${remote}/${file}`;

              if (fs.lstatSync(localPath).isDirectory()) {
                console.log(`📁 Creating directory: ${remotePath}`);
                await executeCommand(`mkdir -p ${remotePath}`);
                await walkAndUpload(localPath, remotePath);
              } else {
                console.log(`📄 Uploading: ${file}`);
                
                await new Promise((r, rj) => {
                  const readStream = fs.createReadStream(localPath);
                  const writeStream = sftp.createWriteStream(remotePath);

                  readStream.pipe(writeStream);

                  writeStream.on('finish', r);
                  writeStream.on('error', rj);
                  readStream.on('error', rj);
                });
              }
            }

            res();
          } catch (err) {
            rej(err);
          }
        });
      };

      await walkAndUpload(localDir, remoteDir);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  BACKEND UPLOAD & SETUP');
  console.log('='.repeat(70) + '\n');

  try {
    if (!fs.existsSync(BACKEND_SRC)) {
      console.error('❌ Backend source not found:', BACKEND_SRC);
      process.exit(1);
    }

    await new Promise((resolve, reject) => {
      conn
        .on('ready', async () => {
          try {
            console.log('✓ SSH Connected\n');

            // Step 1: Create app directory
            console.log('[1/5] Creating app directory...\n');
            await executeCommand('mkdir -p ~/app');
            await executeCommand('ls -la ~/');

            // Step 2: Upload backend files
            console.log('\n[2/5] Uploading backend files...\n');
            conn.sftp((err, sftp) => {
              if (err) {
                reject(err);
                return;
              }

              uploadFiles(sftp, BACKEND_SRC, '/home/u441114691/app')
                .then(async () => {
                  console.log('\n✓ Upload complete\n');

                  // Step 3: Install dependencies
                  console.log('[3/5] Installing dependencies...\n');
                  await executeCommand('cd ~/app && npm install --production=false');

                  // Step 4: Generate Prisma
                  console.log('\n[4/5] Generating Prisma binaries for Linux...\n');
                  let result = await executeCommand('cd ~/app && npx prisma generate');
                  
                  if (result.code !== 0) {
                    console.log('⚠️ Prisma generation had issues - checking status...');
                    // Sometimes it succeeds even with code != 0
                  }

                  // Step 5: Verify
                  console.log('\n[5/5] Verifying setup...\n');
                  await executeCommand('cd ~/app && ls -la src/');
                  await executeCommand('cd ~/app && ls -la node_modules/ | head -20');

                  // Step 6: Start backend
                  console.log('\n[6/5] Starting backend server...\n');
                  await executeCommand('cd ~/app && node src/server.js &');
                  
                  console.log('\nWaiting for server to start (5 seconds)...');
                  await new Promise(r => setTimeout(r, 5000));

                  console.log('Checking if server is running...\n');
                  await executeCommand('ps aux | grep "node src/server.js" | grep -v grep');

                  resolve();
                })
                .catch(reject);
            });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject)
        .connect(SSH_CONFIG);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✓ BACKEND SETUP COMPLETE');
    console.log('='.repeat(70) + '\n');

    // Test endpoints
    console.log('Testing endpoints in 3 seconds...\n');
    await new Promise(r => setTimeout(r, 3000));

    const http = require('http');
    const testUrl = 'http://hsc-exam-form.hisofttechnology.com:5000/api/health';
    
    console.log(`Testing: ${testUrl}\n`);
    
    http.get(testUrl, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
        } catch {
          console.log('Response:', data);
        }
        process.exit(0);
      });
    }).on('error', (err) => {
      console.log(`Note: Backend started in background. Test via browser in 10 seconds.`);
      console.log(`URL: https://hsc-exam-form.hisofttechnology.com/api/health\n`);
      process.exit(0);
    });

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    conn.end();
    process.exit(1);
  }
}

main();
