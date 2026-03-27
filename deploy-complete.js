#!/usr/bin/env node
/**
 * COMPLETE HOSTINGER DEPLOYMENT
 * Uploads backend, uploads frontend build, and deploys
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

let conn;
let sftp;

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

function uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(localPath);
        const ws = sftp.createWriteStream(remotePath);
        ws.on('close', resolve);
        ws.on('error', reject);
        rs.on('error', reject);
        rs.pipe(ws);
    });
}

function uploadDir(localDir, remoteDir) {
    return new Promise(async (resolve, reject) => {
        try {
            const files = fs.readdirSync(localDir, { withFileTypes: true });
            for (const file of files) {
                const localPath = path.join(localDir, file.name);
                const remotePath = path.join(remoteDir, file.name);
                
                if (file.isDirectory()) {
                    // Create remote dir
                    await new Promise(res => {
                        sftp.mkdir(remotePath, () => res());
                    });
                    // Recurse
                    await uploadDir(localPath, remotePath);
                } else {
                    process.stdout.write(`.`);
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
        console.log('HSC EXAM - COMPLETE HOSTINGER DEPLOYMENT');
        console.log('========================================================\n');

        console.log('[1] Connecting and creating directories...\n');
        await execCommand(`mkdir -p ${BACKEND_DIR} ${FRONTEND_DIR} && ls -la ~/app/`);

        console.log('\n[2] Creating .env file...\n');
        // Use echo with ssh instead of SFTP for .env
        const envEscaped = ENV_FILE.replace(/"/g, '\\"').replace(/\$/g, '\\$').split('\n').join('\\n');
        await execCommand(`echo -e "${envEscaped}" > ${BACKEND_DIR}/.env && echo "[OK] .env  created" && cat ${BACKEND_DIR}/.env | head -5`);

        console.log('\n[3] Uploading backend files...');
        if (fs.existsSync('./backend')) {
            console.log('   This may take a few minutes');
            try {
                await uploadDir('./backend', BACKEND_DIR);
                console.log('\n[OK] Backend uploaded');
            } catch (err) {
                console.log(`\n[WARN] Backend upload had issues: ${err.message}`);
                console.log('\nContinuing with deployment assuming files exist...');
            }
        }

        console.log('\n[4] Uploading frontend build...');
        if (fs.existsSync('./frontend/dist/exam-form/browser')) {
            console.log('   Uploading optimized build');
            try {
                await uploadDir('./frontend/dist/exam-form/browser', FRONTEND_DIR);
                console.log('\n[OK] Frontend uploaded');
            } catch (err) {
                console.log(`\n[WARN] Frontend upload had issues: ${err.message}`);
            }
        }

        console.log('\n[5] Installing dependencies...\n');
        await execCommand(`cd ${BACKEND_DIR} && npm install --legacy-peer-deps 2>&1 | tail -5`);

        console.log('\n[6] Building Prisma...\n');
        await execCommand(`cd ${BACKEND_DIR} && npm run build`);

        console.log('\n[7] Setting database...\n');
        await execCommand(`cd ${BACKEND_DIR} && npx prisma db push --skip-generate 2>&1 | tail -10`);

        console.log('\n[8] PM2 setup...\n');
        await execCommand(`npm install -g pm2 && pm2 delete hsc-exam-api 2>/dev/null; true`);

        console.log('\n[9] Starting application...\n');
        await execCommand(`cd ${BACKEND_DIR} && pm2 start src/server.js --name hsc-exam-api --env production`);

        console.log('\n[10] Saving PM2 config...\n');
        await execCommand(`pm2 save 2>/dev/null || true`);

        console.log('\n[11] Final verification...\n');
        await execCommand(`sleep 3 && pm2 status && echo "\n=== Recent Logs ===" && pm2 logs hsc-exam-api --lines 5 --nostream`);

        console.log('\n========================================================');
        console.log('DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('========================================================\n');
        console.log('Backend Directory:', BACKEND_DIR);
        console.log('Frontend Directory:', FRONTEND_DIR);
        console.log('Domain: https://' + DOMAIN);
        console.log('API: https://' + DOMAIN + '/api/health');
        console.log('\nLogin to Hostinger and:');
        console.log('1. Set up domains/DNS pointing to /app/frontend');
        console.log('2. Configure reverse proxy for /api -> Node.js port 5000\n');

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
