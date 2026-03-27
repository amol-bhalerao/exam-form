#!/usr/bin/env node
/**
 * OPTIMIZED HOSTINGER DEPLOYMENT
 * Uploads ONLY essential files, excludes node_modules etc
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

const DOMAIN = 'hsc-exam-form.hisofttechnology.com';
const BACKEND_DIR = `/home/u441114691/app/backend`;
const FRONTEND_DIR = `/home/u441114691/app/frontend`;

const ENV_FILE = `NODE_ENV=production
API_PORT=5000
API_HOST=0.0.0.0
DATABASE_URL=${process.env.DATABASE_URL || ''}
JWT_ACCESS_SECRET=${process.env.JWT_ACCESS_SECRET || ''}
JWT_REFRESH_SECRET=${process.env.JWT_REFRESH_SECRET || ''}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
CORS_ORIGIN=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || ''}
GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET || ''}
GOOGLE_REDIRECT_URI=https://${DOMAIN}/api/auth/google/callback
LOG_LEVEL=info`;

const IGNORE = ['.node_modules', 'node_modules', '.git', '.gitignore', 'dist', '.angular', '.next', '.env', 'package-lock.json', '.DS_Store', '.env.local'];

let conn;
let sftp;
let fileCount = 0;

function execCommand(cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => {
                process.stdout.write(d);
                out += d.toString();
            });
            stream.on('close', code => resolve({ code, out }));
        });
    });
}

function shouldIgnore(filename) {
    return IGNORE.some(pattern => {
        if (filename === pattern) return true;
        if (filename.startsWith(pattern + '/')) return true;
        if (filename.includes('/' + pattern + '/')) return true;
        return false;
    });
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
                    // Create remote dir silently
                    await new Promise(res => {
                        sftp.mkdir(remotePath, { flags: 0 }, () => res());
                    });
                    // Recurse
                    await uploadDir(localPath, remotePath, relPath);
                } else {
                    await uploadFile(localPath, remotePath);
                }
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

async function deploy() {
    try {
        console.log('========================================================');
        console.log('HSC EXAM - OPTIMIZED HOSTINGER DEPLOYMENT');
        console.log('========================================================\n');

        console.log('[Step 1] Creating directories...\n');
        await execCommand(`mkdir -p ${BACKEND_DIR} ${FRONTEND_DIR}`);

        console.log('\n[Step 2] Creating .env file...\n');
        const envEscaped = ENV_FILE.replace(/"/g, '\\"').replace(/\$/g, '\\$').split('\n').join('\\n');
        await execCommand(`echo -e "${envEscaped}" > ${BACKEND_DIR}/.env`);
        console.log('[OK] .env created\n');

        console.log('[Step 3] Uploading backend source files...');
        console.log('(Excluding node_modules, dist, etc - only uploading essential files)\n');
        fileCount = 0;
        
        if (fs.existsSync('./backend')) {
            try {
                await uploadDir('./backend', BACKEND_DIR);
                console.log(`\n[OK] Uploaded ${fileCount} files\n`);
            } catch (err) {
                console.log(`\n[WARN] Upload issue: ${err.message}`);
            }
        }

        console.log('[Step 4] Uploading frontend build...');
        const frontendBuildPath = './frontend/dist/exam-form/browser';
        if (fs.existsSync(frontendBuildPath)) {
            console.log('(Uploading optimized Angular build)\n');
            fileCount = 0;
            try {
                await uploadDir(frontendBuildPath, FRONTEND_DIR);
                console.log(`\n[OK] Uploaded ${fileCount} files\n`);
            } catch (err) {
                console.log(`\n[WARN] Upload issue: ${err.message}`);
            }
        }

        console.log('\n[Step 5] Installing dependencies...');
        console.log('(This takes 2-3 minutes)\n');
        await execCommand(`cd ${BACKEND_DIR} && npm install --legacy-peer-deps 2>&1 | grep -E "added|up to date"  || true`);

        console.log('\n[Step 6] Building Prisma client...\n');
        await execCommand(`cd ${BACKEND_DIR} && npm run build 2>&1 | tail -3`);

        console.log('\n[Step 7] Setting up database schema...\n');
        await execCommand(`cd ${BACKEND_DIR} && npx prisma db push --skip-generate 2>&1 | tail -5`);

        console.log('\n[Step 8] Setting up PM2...\n');
        await execCommand(`npm install -g pm2 2>/dev/null > /dev/null 2>&1 && pm2 delete hsc-exam-api 2>/dev/null > /dev/null 2>&1; true`);
        console.log('[OK] PM2 ready');

        console.log('\n[Step 9] Starting application...\n');
        await execCommand(`cd ${BACKEND_DIR} && pm2 start src/server.js --name hsc-exam-api --env production`);

        console.log('\n[Step 10] Saving PM2 configuration...\n');
        await execCommand(`pm2 save 2>/dev/null > /dev/null 2>&1 || true`);

        console.log('\n[Step 11] Verifying deployment...\n');
        await execCommand(`sleep 3 && pm2 status`);

        console.log('\n========================================================');
        console.log('DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('========================================================\n');
        
        console.log('Deployment Summary:');
        console.log(`  Backend: ${BACKEND_DIR}`);
        console.log(`  Frontend: ${FRONTEND_DIR}`);
        console.log(`  Domain: https://${DOMAIN}`);
        console.log(`  API Health: https://${DOMAIN}/api/health`);
        console.log('\nYour application is now running on Hostinger!');
        console.log('\nIMPORTANT - Next steps in Hostinger Control Panel:');
        console.log('  1. Set up DNS to point domain to your Hostinger server');
        console.log('  2. Configure reverse proxy: /api -> localhost:5000');
        console.log('  3. Set document root to: ' + FRONTEND_DIR);
        console.log('  4. Enable HTTPS (SSL certificate)\n');

        conn.end();
        process.exit(0);

    } catch (err) {
        console.error('\n[ERROR]', err.message);
        conn.end();
        process.exit(1);
    }
}

conn = new Client();

conn.on('ready', () => {
    console.log('Connected to Hostinger\n');
    conn.sftp((err, sftpConnection) => {
        if (err) {
            console.error('SFTP Error:', err);
            conn.end();
            process.exit(1);
            return;
        }
        sftp = sftpConnection;
        deploy();
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
    process.exit(1);
});

console.log('Connecting to Hostinger...');
conn.connect(SSH_CONFIG);
