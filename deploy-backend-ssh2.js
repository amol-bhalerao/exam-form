#!/usr/bin/env node
/**
 * Backend Deployment Script using ssh2 library
 * Uploads backend files to Hostinger via SSH
 */

const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '45.130.228.77',
  port: 65002,
  username: 'u441114691',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'hostinger')),
};

const REMOTE_PATH = '/home/u441114691/app';
const LOCAL_PATHS = [
  'backend/src',
  'backend/package.json',
  'backend/prisma',
  'backend/.npmrc',
  'backend/.prettierrc',
  'backend/.eslintrc.js',
];

let conn = new Client();

function uploadFiles() {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('  Backend Deployment to Hostinger (via SSH2)');
      console.log('═══════════════════════════════════════════════════════════════\n');

      let uploaded = 0;
      let total = LOCAL_PATHS.length;

      LOCAL_PATHS.forEach((localPath) => {
        const remotePath = `${REMOTE_PATH}/${path.basename(localPath)}`;

        if (fs.lstatSync(localPath).isDirectory()) {
          uploadDirectory(sftp, localPath, remotePath, (err) => {
            if (err) {
              console.error(`✗ Error uploading ${localPath}:`, err.message);
            } else {
              console.log(`✓ Uploaded: ${localPath}`);
              uploaded++;
              if (uploaded === total) {
                console.log('\n✓ All files uploaded successfully!');
                console.log('\nNext steps on Hostinger:');
                console.log('  1. Connect: ssh -i ~/.ssh/hostinger -p 65002 u441114691@45.130.228.77');
                console.log('  2. Go to app: cd ~/app');
                console.log('  3. Install: npm install --production=false');
                console.log('  4. Generate Prisma: npx prisma generate');
                console.log('  5. Restart: pm2 restart app\n');
                resolve();
              }
            }
          });
        } else {
          uploadFile(sftp, localPath, remotePath, (err) => {
            if (err) {
              console.error(`✗ Error uploading ${localPath}:`, err.message);
            } else {
              console.log(`✓ Uploaded: ${localPath}`);
              uploaded++;
              if (uploaded === total) {
                console.log('\n✓ All files uploaded successfully!');
                console.log('\nNext steps on Hostinger:');
                console.log('  1. Connect: ssh -i ~/.ssh/hostinger -p 65002 u441114691@45.130.228.77');
                console.log('  2. Go to app: cd ~/app');
                console.log('  3. Install: npm install --production=false');
                console.log('  4. Generate Prisma: npx prisma generate');
                console.log('  5. Restart: pm2 restart app\n');
                resolve();
              }
            }
          });
        }
      });
    });
  });
}

function uploadFile(sftp, localPath, remotePath, callback) {
  const readStream = fs.createReadStream(localPath);
  const writeStream = sftp.createWriteStream(remotePath);

  readStream.pipe(writeStream);

  writeStream.on('finish', () => {
    callback(null);
  });

  writeStream.on('error', (err) => {
    callback(err);
  });

  readStream.on('error', (err) => {
    callback(err);
  });
}

function uploadDirectory(sftp, localDir, remoteDir, callback) {
  fs.readdirSync(localDir).forEach((file) => {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;

    if (fs.lstatSync(localPath).isDirectory()) {
      uploadDirectory(sftp, localPath, remotePath, (err) => {
        if (err) callback(err);
      });
    } else {
      uploadFile(sftp, localPath, remotePath, (err) => {
        if (err) callback(err);
      });
    }
  });

  callback(null);
}

// Main execution
console.log('Connecting to Hostinger...');

conn
  .on('ready', async () => {
    try {
      await uploadFiles();
      conn.end();
    } catch (err) {
      console.error('Deployment error:', err.message);
      conn.end();
      process.exit(1);
    }
  })
  .on('error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
  })
  .connect(SSH_CONFIG);
