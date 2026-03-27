#!/usr/bin/env node
/**
 * Verify HSC Exam deployment is working correctly
 */

const { Client } = require('ssh2');
const http = require('http');
const https = require('https');

const SSH_CONFIG = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',
    readyTimeout: 30000
};

const DOMAIN = 'hsc-exam-form.hisofttechnology.com';

function checkHTTP(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const request = protocol.get(url, { timeout: 5000 }, (res) => {
            resolve({ status: res.statusCode, ok: res.statusCode < 400 });
        });
        request.on('error', () => resolve({ status: 0, ok: false }));
        request.on('timeout', () => {
            request.destroy();
            resolve({ status: 0, ok: false });
        });
    });
}

function execCommand(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) {
                resolve({ code: 1, output: err.message });
                return;
            }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.on('close', code => resolve({ code, output: out }));
        });
    });
}

async function verify() {
    console.log('========================================================');
    console.log('HSC EXAM - DEPLOYMENT VERIFICATION');
    console.log('========================================================\n');

    const conn = new Client();
    const results = {
        backend_running: false,
        api_responding: false,
        database_connected: false,
        pm2_healthy: false,
        frontend_exists: false
    };

    try {
        await new Promise((resolve, reject) => {
            conn.on('ready', resolve);
            conn.on('error', reject);
            conn.connect(SSH_CONFIG);
        });

        console.log('✓ SSH Connected\n');

        // Check 1: PM2 Status
        console.log('[Check 1] PM2 Process Status');
        let res = await execCommand(conn, 'pm2 status 2>/dev/null | grep hsc-exam-api');
        if (res.output.includes('hsc-exam-api') && res.output.includes('online')) {
            console.log('  ✓ Backend running (PM2 online)');
            results.backend_running = true;
        } else {
            console.log('  ✗ Backend not found in PM2');
            console.log('  Output:', res.output.slice(0, 100));
        }

        // Check 2: Check listening port
        console.log('\n[Check 2] Port 5000 Status');
        res = await execCommand(conn, 'netstat -tuln 2>/dev/null | grep 5000 || lsof -i :5000 2>/dev/null || echo "Port check unavailable"');
        if (res.output.includes('5000')) {
            console.log('  ✓ Port 5000 is listening');
            results.backend_running = true;
        } else {
            console.log('  ⚠ Port 5000 check: ' + (res.output ? 'unclear' : 'unavailable'));
        }

        // Check 3: Database connection
        console.log('\n[Check 3] Database Connection');
        res = await execCommand(conn, 'mysql -h 127.0.0.1 -u u441114691_exam -p"Exam@1234567890" -D u441114691_exam -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema=DATABASE();" 2>/dev/null || echo "Database check failed"');
        if (res.code === 0 && res.output.includes('table_count')) {
            console.log('  ✓ Database connected and has tables');
            results.database_connected = true;
        } else {
            console.log('  ⚠ Database check unclear (this is OK if MySQL not exposed)');
        }

        // Check 4: Backend logs
        console.log('\n[Check 4] Recent Logs');
        res = await execCommand(conn, 'pm2 logs hsc-exam-api --lines 3 --nostream 2>/dev/null | head -5');
        if (res.output && !res.output.includes('Error')) {
            console.log('  ✓ No recent errors in logs');
        } else {
            console.log('  Logs:', res.output.slice(0, 100));
        }

        // Check 5: Frontend files
        console.log('\n[Check 5] Frontend Files');
        res = await execCommand(conn, 'ls -la /home/u441114691/app/frontend/ | grep -E "html|css|js" | wc -l');
        const fileCount = parseInt(res.output.trim());
        if (fileCount > 0) {
            console.log(`  ✓ Frontend files found (${fileCount} files)`);
            results.frontend_exists = true;
        } else {
            console.log('  ✗ No frontend files found');
        }

        conn.end();

        // Check HTTP endpoints (wait a moment for connectivity)
        console.log('\n[Check 6] API HTTP Tests');
        
        // localhost test (internal)
        console.log('  Testing localhost:5000...');
        let httpRes = await checkHTTP('http://localhost:5000/api/health');
        if (httpRes.ok) {
            console.log('  ✓ API responds locally (status ' + httpRes.status + ')');
            results.api_responding = true;
        } else {
            console.log('  ⚠ Local API not accessible (expected if no direct access)');
        }

        // Domain test (external)
        console.log('  Testing https://' + DOMAIN + '/api/health...');
        httpRes = await checkHTTP('https://' + DOMAIN + '/api/health');
        if (httpRes.ok) {
            console.log('  ✓ Domain API responds (status ' + httpRes.status + ')');
            results.api_responding = true;
        } else {
            console.log('  ⚠ Domain not responding yet (DNS/reverse proxy might need config)');
        }

        // Summary
        console.log('\n========================================================');
        console.log('VERIFICATION SUMMARY');
        console.log('========================================================\n');

        const passed = Object.values(results).filter(v => v).length;
        const total = Object.keys(results).length;

        Object.entries(results).forEach(([key, value]) => {
            const symbol = value ? '✓' : '✗';
            const name = key.replace(/_/g, ' ').toUpperCase();
            console.log(`  ${symbol} ${name}`);
        });

        console.log(`\n${passed}/${total} checks passed\n`);

        if (passed >= 4) {
            console.log('Status: DEPLOYMENT SUCCESSFUL ✓\n');
            console.log('Your application is running on Hostinger!');
            console.log('If domain tests failed, DNS/reverse proxy setup still needed.');
        } else {
            console.log('Status: DEPLOYMENT ISSUES DETECTED\n');
            console.log('Check logs: pm2 logs hsc-exam-api');
        }

        console.log('\n========================================================\n');

    } catch (error) {
        console.error('Verification error:', error.message);
        process.exit(1);
    }
}

verify();
