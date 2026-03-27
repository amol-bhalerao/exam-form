#!/usr/bin/env node
/**
 * Pure SFTP Backend Upload (No Shell Commands)
 * Uploads all backend files via SFTP
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
const REMOTE_DIR = '/home/u441114691/app';

let conn = new Client();
let fileCount = 0;
let uploadedCount = 0;

function uploadFilesRecursive(sftp, localPath, remotePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const stat = fs.lstatSync(localPath);

      if (stat.isDirectory()) {
        // Create remote directory
        sftp.mkdir(remotePath, { recursive: true }, (err) => {
          if (err && err.code !== 2) {
            reject(err);
            return;
          }

          // Upload all files in directory
          const files = fs.readdirSync(localPath);
          let completed = 0;

          if (files.length === 0) {
            resolve();
            return;
          }

          files.forEach((file) => {
            // Skip node_modules, .git, etc
            if (['node_modules', '.git', '.next', 'dist', 'tests'].includes(file)) {
              completed++;
              if (completed === files.length) resolve();
              return;
            }

            uploadFilesRecursive(
              sftp,
              path.join(localPath, file),
              `${remotePath}/${file}`
            )
              .then(() => {
                completed++;
                if (completed === files.length) resolve();
              })
              .catch(reject);
          });
        });
      } else {
        // Upload file
        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        uploadedCount++;
        process.stdout.write(`\r  [${uploadedCount}/${fileCount}] Uploading... ${path.basename(localPath)}`);

        readStream.pipe(writeStream);

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

function countFiles(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;

  files.forEach((file) => {
    if (['node_modules', '.git', '.next', 'dist', 'tests'].includes(file)) return;

    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  });

  return count;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  BACKEND SFTP UPLOAD');
  console.log('='.repeat(70) + '\n');

  try {
    fileCount = countFiles(BACKEND_SRC);
    console.log(`Files to upload: ${fileCount}\n`);

    await new Promise((resolve, reject) => {
      conn
        .on('ready', () => {
          console.log('✓ SSH Connected\n');
          console.log('Uploading files...');

          conn.sftp((err, sftp) => {
            if (err) {
              reject(err);
              return;
            }

            uploadFilesRecursive(sftp, BACKEND_SRC, REMOTE_DIR)
              .then(() => {
                console.log(`\n✓ All ${uploadedCount} files uploaded\n`);
                resolve();
              })
              .catch(reject);
          });
        })
        .on('error', reject)
        .connect(SSH_CONFIG);
    });

    // Now run setup commands via SFTP exec
    console.log('Setting up backend on server...\n');

    await new Promise((resolve, reject) => {
      conn
        .on('ready', () => {
          // Run setup via shell
          const setupScript = `
cd /home/u441114691/app
npm install --production=false 2>&1 | tail -20
echo "---"
npx prisma generate 2>&1 | tail -20
echo "---"
ls -la src/ | head -10
echo "SETUP COMPLETE"
`;

          conn.exec(setupScript, (err, stream) => {
            if (err) {
              reject(err);
              return;
            }

            let output = '';
            stream.on('close', (code) => {
              console.log(output);
              resolve();
            });

            stream.on('data', (data) => {
              output += data;
              process.stdout.write(data);
            });

            stream.on('error', (err) => {
              output += err.message;
            });
          });
        })
        .on('error', reject)
        .connect(SSH_CONFIG);
    });

    conn.end();

    console.log('\n' + '='.repeat(70));
    console.log('✓ BACKEND UPLOAD & SETUP COMPLETE');
    console.log('='.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Create a startup script in Hostinger (or use Node.js App feature)');
    console.log('2. Start the application: cd ~/app && node src/server.js');
    console.log('3. Or use PM2: pm2 start src/server.js --name app');
    console.log('4. Test: curl https://hsc-exam-form.hisofttechnology.com/api/health\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    conn.end();
    process.exit(1);
  }
}

main();
