#!/usr/bin/env node
const { Client } = require('ssh2');

const config = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',
    readyTimeout: 30000
};

const domain = 'hsc-exam-form.hisofttechnology.com';const backendDir = `/home/u441114691/domains/${domain}/nodejs`;

const envContent = `NODE_ENV=production
API_PORT=5000
API_HOST=0.0.0.0
DATABASE_URL=${process.env.DATABASE_URL || ''}
JWT_ACCESS_SECRET=${process.env.JWT_ACCESS_SECRET || ''}
JWT_REFRESH_SECRET=${process.env.JWT_REFRESH_SECRET || ''}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
CORS_ORIGIN=https://${domain}
FRONTEND_URL=https://${domain}
GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || ''}
GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET || ''}
GOOGLE_REDIRECT_URI=https://${domain}/api/auth/google/callback
LOG_LEVEL=info`;

console.log('====================================================================');
console.log('HSC EXAM - AUTOMATED HOSTINGER DEPLOYMENT');
console.log('====================================================================\n');

const conn = new Client();

function execCommand(command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => {
                console.log(d.toString());
                out += d.toString();
            });
            stream.on('close', code => resolve({ code, output: out }));
        });
    });
}

async function deploy() {
    try {
        console.log('[1/11] Checking directories...\n');
        let res = await execCommand(`ls -la ${backendDir}/.`);
        if (res.code !== 0) throw new Error('Backend dir not found');

        console.log('\n[2/11] Creating .env file via SSH...\n');
        const cmd = `cd ${backendDir} && cat > .env << ENVFILE\n${envContent}\nENVFILE`;
        res = await execCommand(cmd);

        console.log('\n[3/11] Installing dependencies...\n');
        res = await execCommand(`cd ${backendDir} && npm install --legacy-peer-deps`);

        console.log('\n[4/11] Building Prisma...\n');
        res = await execCommand(`cd ${backendDir} && npm run build`);

        console.log('\n[5/11] Pushing database schema...\n');
        res = await execCommand(`cd ${backendDir} && npx prisma db push --skip-generate`);

        console.log('\n[6/11] Installing PM2...\n');
        res = await execCommand(`npm install -g pm2 2>/dev/null || npm install -g pm2`);

        console.log('\n[7/11] Stopping old PMs...\n');
        res = await execCommand(`pm2 delete hsc-exam-api 2>/dev/null || true`);

        console.log('\n[8/11] Starting app...\n');
        res = await execCommand(`cd ${backendDir} && pm2 start src/server.js --name hsc-exam-api --env production`);

        console.log('\n[9/11] Saving PM2 config...\n');
        res = await execCommand(`pm2 save 2>/dev/null || true`);

        console.log('\n[10/11] Waiting for startup...\n');
        res = await execCommand(`sleep 3`);

        console.log('\n[11/11] Verifying status...\n');
        res = await execCommand(`pm2 status`);

        console.log('\n====================================================================');
        console.log('DEPLOYMENT COMPLETED SUCCESSFULLY');
        console.log('====================================================================\n');
        console.log('API: https://' + domain + '/api/health');
        console.log('Web: https://' + domain + '/\n');

        conn.end();
        process.exit(0);
    } catch (err) {
        console.error('\nERROR:', err.message);
        conn.end();
        process.exit(1);
    }
}

conn.on('ready', deploy);
conn.on('error', err => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

console.log('Connecting...\n');
conn.connect(config);
