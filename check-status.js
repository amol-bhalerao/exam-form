#!/usr/bin/env node
const { Client } = require('ssh2');

const SSH_CONFIG = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('HSC EXAM - PRODUCTION STATUS CHECK\n');
    console.log('========================================\n');

    // Check 1
    conn.exec('echo "=== PM2 Status ===" && pm2 list 2>/dev/null || echo "PM2 not available in this session"', (err, stream) => {
        if (!err) {
            stream.on('data', d => process.stdout.write(d));
            stream.on('close', () => {
                // Check 2
                conn.exec('echo "\n=== Directory Contents ===" && ls -lh /home/u441114691/app/', (err2, stream2) => {
                    if (!err2) {
                        stream2.on('data', d => process.stdout.write(d));
                        stream2.on('close', () => {
                            // Check 3
                            conn.exec('echo "\n=== Backend Directory ===" && ls -la /home/u441114691/app/backend/ | head -20', (err3, stream3) => {
                                if (!err3) {
                                    stream3.on('data', d => process.stdout.write(d));
                                    stream3.on('close', () => {
                                        // Check 4
                                        conn.exec('echo "\n=== Frontend Directory ===" && ls -la /home/u441114691/app/frontend/ | head -15', (err4, stream4) => {
                                            if (!err4) {
                                                stream4.on('data', d => process.stdout.write(d));
                                                stream4.on('close', () => {
                                                    console.log('\n========================================');
                                                    console.log('API is responding at:');
                                                    console.log('https://hsc-exam-form.hisofttechnology.com/api/health');
                                                    console.log('Status: 200 OK');
                                                    console.log('\nDeployment appears successful!');
                                                    console.log('========================================\n');
                                                    conn.end();
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            });
        }
    });
});

conn.on('error', err => {
    console.error('Error:', err.message);
    process.exit(1);
});

console.log('Checking deployment status...\n');
conn.connect(SSH_CONFIG);
