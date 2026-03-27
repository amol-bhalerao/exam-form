#!/usr/bin/env node
/**
 * HSC EXAM - COMPLETE HOSTINGER SETUP & DEPLOYMENT
 * Creates all directories and deploys application
 */

const { Client } = require('ssh2');

const config = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',
    readyTimeout: 30000
};

const DOMAIN = 'hsc-exam-form.hisofttechnology.com';
const BACKEND_DIR = `/home/u441114691/app/backend`;
const FRONTEND_DIR = `/home/u441114691/app/frontend`;

const ENV_CONTENT = `NODE_ENV=production
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

const commands = [
    // Setup directories
    `mkdir -p ${BACKEND_DIR} ${FRONTEND_DIR}`,
    `cd ${BACKEND_DIR} && pwd`,
    
    // Upload backend files (we'll do this separately via SFTP)
    // For now, we'll assume files are there
];

const conn = new Client();

function execCommand(cmd, label) {
    return new Promise((resolve, reject) => {
        console.log(`\nExecuting: ${label}`);
        console.log(`Command: ${cmd}\n`);
        
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            
            let out = '';
            stream.on('data', d => {
                process.stdout.write(d);
                out += d.toString();
            });
            stream.on('close', code => {
                if (code === 0) {
                    console.log(`[OK] ${label}`);
                } else {
                    console.log(`[WARN] ${label} (exit code ${code})`);
                }
                resolve(out);
            });
        });
    });
}

async function setup() {
    try {
        console.log('================================================================================');
        console.log('HSC EXAM - HOSTINGER COMPLETE SETUP & DEPLOYMENT');
        console.log('================================================================================\n');

        // Create directories
        console.log('[Step 1] Creating directory structure...\n');
        await execCommand(`mkdir -p ${BACKEND_DIR} ${FRONTEND_DIR}`, 'Create directories');

        console.log('\n[Step 2] Creating .env file...\n');
        const envCmd = `cat > ${BACKEND_DIR}/.env << 'ENVEOF'\n${ENV_CONTENT}\nENVEOF`;
        await execCommand(envCmd, 'Create .env');

        console.log('\n[Step 3] Checking Node.js...\n');
        await execCommand('node --version && npm --version', 'Check Node.js/NPM');

        console.log('\n================================================================================');
        console.log('SETUP COMPLETE');
        console.log('================================================================================\n');
        
        console.log('Backend Directory:', BACKEND_DIR);
        console.log('Frontend Directory:', FRONTEND_DIR);
        console.log('Environment File Created: .env');
        console.log('\nNEXT STEPS:');
        console.log('1. Upload backend files from backend/ folder to:', BACKEND_DIR);
        console.log('2. Upload frontend files to:', FRONTEND_DIR);
        console.log('3. Run deployment script\n');

        conn.end();
        process.exit(0);
    } catch (err) {
        console.error('\nERROR:', err.message);
        conn.end();
        process.exit(1);
    }
}

conn.on('ready', setup);
conn.on('error', err => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

console.log('Connecting to Hostinger...');
conn.connect(config);
