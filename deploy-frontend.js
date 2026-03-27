#!/usr/bin/env node

const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const HOSTINGER_CONFIG = {
  host: '45.130.228.77',
  port: 65002,
  username: 'u441114691',
  password: process.env.HOSTINGER_PASSWORD || 'Aarya@20211234567890',
};

const FRONTEND_BUILD_PATH = path.join(__dirname, 'frontend', 'dist', 'exam-form');

async function deployFrontend() {
  if (!fs.existsSync(FRONTEND_BUILD_PATH)) {
    console.error(`❌ Error: Frontend build directory not found at ${FRONTEND_BUILD_PATH}`);
    console.error('Please run: npm run build (in frontend directory)');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', async () => {
      try {
        // Get SFTP client for file transfer
        client.sftp((err, sftp) => {
          if (err) {
            client.end();
            return reject(err);
          }

          console.log('📦 Connected to Hostinger - Deploying Frontend...\n');

          // Upload frontend files recursively
          uploadDirectory(sftp, FRONTEND_BUILD_PATH, '/home/u441114691/app/frontend', (uploadErr) => {
            if (uploadErr) {
              client.end();
              return reject(uploadErr);
            }

            console.log('\n✅ Frontend deployment complete!');
            console.log('🌐 URL: https://hsc-exam-form.hisofttechnology.com');
            
            // Close connection
            client.end();
            resolve();
          });
        });
      } catch (error) {
        client.end();
        reject(error);
      }
    });

    client.on('error', (err) => {
      reject(new Error(`SSH Connection Error: ${err.message}`));
    });

    client.connect(HOSTINGER_CONFIG);
  });
}

function uploadDirectory(sftp, localDir, remoteDir, callback) {
  const files = fs.readdirSync(localDir);
  let completed = 0;
  let hasError = false;

  if (files.length === 0) {
    callback(null);
    return;
  }

  files.forEach((file) => {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // Create remote directory and recursively upload
      sftp.mkdir(remotePath, (mkdirErr) => {
        if (mkdirErr && mkdirErr.code !== 2) { // Code 2 = file already exists
          console.error(`❌ Failed to create directory ${remotePath}: ${mkdirErr.message}`);
          hasError = true;
        }
        
        uploadDirectory(sftp, localPath, remotePath, (dirErr) => {
          if (dirErr) hasError = true;
          completed++;
          if (completed === files.length) {
            callback(hasError ? new Error('Upload completed with errors') : null);
          }
        });
      });
    } else {
      // Upload file
      sftp.fastPut(localPath, remotePath, (putErr) => {
        if (putErr) {
          console.error(`❌ Failed to upload ${file}: ${putErr.message}`);
          hasError = true;
        } else {
          const size = (stat.size / 1024).toFixed(2);
          console.log(`  ✓ ${file} (${size} KB)`);
        }
        
        completed++;
        if (completed === files.length) {
          callback(hasError ? new Error('Upload completed with errors') : null);
        }
      });
    }
  });
}

// Run deployment
deployFrontend()
  .then(() => {
    console.log('\n🎉 Deployment successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Deployment failed: ${error.message}`);
    process.exit(1);
  });
