#!/usr/bin/env node
/**
 * FRONTEND DEPLOYMENT ONLY
 * Updates frontend files on Hostinger server
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',
    readyTimeout: 30000
};

const FRONTEND_BUILD_DIR = path.join(__dirname, 'frontend', 'dist', 'exam-form');
const REMOTE_FRONTEND_DIR = '/home/u441114691/app/frontend';

const IGNORE = ['.git', '.gitignore', '.DS_Store', '.env'];

let conn;
let sftp;
let fileCount = 0;

function shouldIgnore(filePath) {
    const parts = filePath.split('/');
    return parts.some(part => IGNORE.includes(part));
}

function uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(localPath);
        const ws = sftp.createWriteStream(remotePath);
        ws.on('close', () => {
            fileCount++;
            process.stdout.write('.');
            resolve();
        });
        ws.on('error', reject);
        rs.on('error', reject);
        rs.pipe(ws);
    });
}

async function uploadDir(localDir, remoteDir, basePath = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const files = fs.readdirSync(localDir, { withFileTypes: true });
            
            for (const file of files) {
                const relPath = basePath ? `${basePath}/${file.name}` : file.name;
                
                if (shouldIgnore(relPath) || file.name.startsWith('.')) {
                    continue;
                }
                
                const localPath = path.join(localDir, file.name);
                const remotePath = path.join(remoteDir, file.name);
                
                if (file.isDirectory()) {
                    // Create remote dir
                    await new Promise(res => {
                        sftp.mkdir(remotePath, { flags: 0 }, () => res());
                    });
                    
                    await uploadDir(localPath, remotePath, relPath);
                } else {
                    await uploadFile(localPath, remotePath);
                }
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

async function deployFrontend() {
    return new Promise((resolve, reject) => {
        conn = new Client();

        conn.on('ready', async () => {
            try {
                console.log('🔗 Connected to Hostinger\n');
                
                conn.sftp(async (err, sftpClient) => {
                    if (err) return reject(err);
                    
                    sftp = sftpClient;
                    
                    console.log('📤 Uploading frontend files...\n');
                    await uploadDir(FRONTEND_BUILD_DIR, REMOTE_FRONTEND_DIR);
                    
                    console.log(`\n\n✅ Frontend deployment complete!`);
                    console.log(`📊 Uploaded ${fileCount} files`);
                    console.log(`🌐 URL: https://hsc-exam-form.hisofttechnology.com\n`);
                    
                    sftp.end();
                    conn.end();
                    resolve();
                });
            } catch (error) {
                conn.end();
                reject(error);
            }
        });

        conn.on('error', (err) => {
            reject(new Error(`SSH Error: ${err.message}`));
        });

        console.log('🔌 Connecting to Hostinger...');
        conn.connect(SSH_CONFIG);
    });
}

deployFrontend()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    });
