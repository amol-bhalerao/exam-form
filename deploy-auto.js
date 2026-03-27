#!/usr/bin/env node

/**
 * HSC Exam System - Automated Hostinger Deployment
 * Uses ssh2 library for password-based authentication
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',  // Production password
    readyTimeout: 30000
};

const domain = 'hsc-exam-form.hisofttechnology.com';
const backendDir = `/home/u441114691/domains/${domain}/nodejs`;
const frontendDir = `/home/u441114691/domains/${domain}/public_html`;

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  HSC EXAM - AUTOMATED HOSTINGER DEPLOYMENT            ║');
console.log('║  Using SSH2 for password authentication                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const conn = new Client();

function executeCommand(command, description) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) reject(err);

            let output = '';
            let errorOutput = '';

            stream.on('close', (code, signal) => {
                if (code === 0) {
                    console.log(`[✓] ${description}`);
                    resolve(output);
                } else {
                    console.log(`[✗] ${description} (exit code: ${code})`);
                    console.log(errorOutput || output);
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            stream.on('data', (data) => {
                output += data.toString();
                process.stdout.write(data);
            });

            stream.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
        });
    });
}

async function deploymentSteps() {
    try {
        console.log('\n[Step 1] Testing connection...\n');
        await executeCommand('echo "SSH connection successful"', 'SSH Connection');

        console.log('\n[Step 2] Creating .env configuration...\n');
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

        // Use printf with escape sequences instead of cat
        const escapedContent = envContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const envCommand = `cd ${backendDir} && printf "${escapedContent}" > .env`;
        await executeCommand(envCommand, 'Created .env file');

        console.log('\n[Step 3] Installing dependencies...\n');
        await executeCommand(`cd ${backendDir} && npm install --legacy-peer-deps`, 'Dependencies installed');

        console.log('\n[Step 4] Building Prisma client...\n');
        await executeCommand(`cd ${backendDir} && npm run build`, 'Prisma client generated');

        console.log('\n[Step 5] Setting up database...\n');
        await executeCommand(`cd ${backendDir} && npx prisma db push --skip-generate`, 'Database configured');

        console.log('\n[Step 6] Installing PM2...\n');
        await executeCommand('npm install -g pm2 || true', 'PM2 installed');

        console.log('\n[Step 7] Stopping existing process...\n');
        await executeCommand('pm2 delete hsc-exam-api || true', 'Cleanup');

        console.log('\n[Step 8] Starting application...\n');
        await executeCommand(`cd ${backendDir} && pm2 start src/server.js --name "hsc-exam-api" --env production`, 'Application started');

        console.log('\n[Step 9] Configuring auto-restart...\n');
        await executeCommand('pm2 save && pm2 startup || true', 'Auto-restart configured');

        console.log('\n[Step 10] Verifying deployment...\n');
        await executeCommand('sleep 2 && pm2 list', 'Status check');

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║       BACKEND DEPLOYMENT COMPLETED SUCCESSFULLY        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        console.log('Next steps:');
        console.log(`  1. Upload frontend files to: ${frontendDir}`);
        console.log(`  2. Test API: curl https://${domain}/api/health`);
        console.log(`  3. Visit: https://${domain}/\n`);

        conn.end();
    } catch (error) {
        console.error('\n[ERROR] Deployment failed:', error.message);
        conn.end();
        process.exit(1);
    }
}

conn.on('ready', () => {
    console.log('Connected to Hostinger server\n');
    deploymentSteps();
});

conn.on('error', (err) => {
    console.error('SSH Connection Error:', err);
    process.exit(1);
});

console.log('Connecting to Hostinger...');
conn.connect(config);
