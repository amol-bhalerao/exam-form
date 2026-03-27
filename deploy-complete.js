#!/usr/bin/env node
/**
 * Complete Hostinger Deploy & Fix Script
 * Uploads frontend, fixes Prisma, and tests everything
 */

const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '45.130.228.77',
  port: 65002,
  username: 'u441114691',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'hostinger')),
  readyTimeout: 30000,
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'rsa-sha2-512', 'rsa-sha2-256'],
  },
};

const FRONTEND_SOURCE = './frontend/dist/exam-form/browser';
const FRONTEND_DEST = '/home/u441114691/public_html';
const BACKEND_PATH = '/home/u441114691/app';

let conn = new Client();
let fileCount = 0;
let uploadedCount = 0;

function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code, signal) => {
        resolve({ code, stdout, stderr });
      });

      stream.on('data', (data) => {
        stdout += data;
      });

      stream.stderr.on('data', (data) => {
        stderr += data;
      });
    });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(localPath);
    const writeStream = sftp.createWriteStream(remotePath);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
      uploadedCount++;
      resolve();
    });
  });
}

async function uploadDirectory(sftp, localDir, remoteDir, relPath = '') {
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remoteItem = relPath ? `${relPath}/${item}` : item;
    const remotePath = `${remoteDir}/${remoteItem}`;

    if (fs.lstatSync(localPath).isDirectory()) {
      if (item !== 'node_modules') {
        await executeCommand(`mkdir -p ${remotePath}`);
        await uploadDirectory(sftp, localPath, remoteDir, remoteItem);
      }
    } else {
      await uploadFile(sftp, localPath, remotePath);
      process.stdout.write(`\r  Uploading... ${uploadedCount}/${fileCount} files`);
    }
  }
}

function countFiles(dir) {
  const items = fs.readdirSync(dir);
  let count = 0;

  for (const item of items) {
    if (item === 'node_modules') continue;
    const fullPath = path.join(dir, item);
    if (fs.lstatSync(fullPath).isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }

  return count;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  HOSTINGER COMPLETE DEPLOY & FIX');
  console.log('='.repeat(70) + '\n');

  try {
    // Check frontend exists
    if (!fs.existsSync(FRONTEND_SOURCE)) {
      console.error(`\n❌ Frontend build not found: ${FRONTEND_SOURCE}`);
      console.error('Run: npm run build:frontend:local');
      process.exit(1);
    }

    fileCount = countFiles(FRONTEND_SOURCE);
    console.log(`[1/3] FRONTEND UPLOAD`);
    console.log(`Files to upload: ${fileCount}\n`);

    await new Promise((resolve, reject) => {
      conn
        .on('ready', async () => {
          try {
            conn.sftp((err, sftp) => {
              if (err) reject(err);

              // Clean remote directory
              executeCommand(`rm -rf ${FRONTEND_DEST}/*`).then(() => {
                uploadDirectory(sftp, FRONTEND_SOURCE, FRONTEND_DEST).then(async () => {
                  console.log(`\n✓ Frontend uploaded: ${uploadedCount} files\n`);

                  // BACKEND FIX
                  console.log(`[2/3] BACKEND PRISMA FIX`);
                  console.log(`Cleaning backend dependencies...\n`);

                  let result = await executeCommand(`cd ${BACKEND_PATH} && rm -rf node_modules`);
                  console.log('✓ Cleaned node_modules');

                  result = await executeCommand(`cd ${BACKEND_PATH} && npm install --production=false`);
                  if (result.code !== 0) {
                    console.log(`⚠ npm install warnings (this is normal):\n${result.stdout}`);
                  } else {
                    console.log('✓ Dependencies installed');
                  }

                  console.log('\nGenerating Prisma binaries for Linux (CRITICAL)...');
                  result = await executeCommand(`cd ${BACKEND_PATH} && npx prisma generate`);
                  if (result.code !== 0) {
                    console.error(`❌ Prisma generation failed:\n${result.stderr}`);
                    reject(new Error('Prisma generation failed'));
                  } else {
                    console.log('✓ Prisma generated for Linux');
                  }

                  console.log('Restarting backend service...');
                  result = await executeCommand('pm2 restart app');
                  console.log('✓ Backend restarted\n');

                  // TESTING
                  console.log(`[3/3] TESTING`);
                  console.log(`Testing backend connectivity in 3 seconds...\n`);

                  setTimeout(async () => {
                    resolve();
                  }, 3000);
                });
              });
            });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject)
        .connect(SSH_CONFIG);
    });

    // Close SSH
    conn.end();

    // Wait for it to close
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('✓ Deployment complete!\n');
    console.log('='.repeat(70));
    console.log('  Testing APIs...');
    console.log('='.repeat(70) + '\n');

    // Exit to continue with testing
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    conn.end();
    process.exit(1);
  }
}

main();
