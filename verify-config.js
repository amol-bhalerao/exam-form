#!/usr/bin/env node
/**
 * POST-CONFIGURATION VERIFICATION SCRIPT
 * Run this after configuring Hostinger cPanel to verify everything works
 */

const https = require('https');
const http = require('http');

const DOMAIN = 'hsc-exam-form.hisofttechnology.com';
const tests = [];

function addTest(name, url, expectJSON = false) {
    tests.push({ name, url, expectJSON });
}

// Define all tests
addTest('Frontend Home Page', `https://${DOMAIN}`, false);
addTest('API Health Check', `https://${DOMAIN}/api/health`, true);
addTest('Public Colleges', `https://${DOMAIN}/api/public/colleges`, true);
addTest('Public Streams', `https://${DOMAIN}/api/public/streams`, true);
addTest('Public Subjects', `https://${DOMAIN}/api/public/subjects`, true);
addTest('Public Boards', `https://${DOMAIN}/api/public/boards`, true);

let passed = 0;
let failed = 0;
let warnings = 0;

function makeRequest(url, expectJSON) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const timeoutId = setTimeout(() => {
            resolve({
                status: 0,
                error: 'Timeout (>10s)',
                isJSON: false
            });
        }, 10000);

        protocol.get(url, { rejectUnauthorized: false }, (res) => {
            clearTimeout(timeoutId);
            let data = '';
            
            res.on('data', chunk => data += chunk.substring(0, 200)); // Limit to 200 chars
            res.on('end', () => {
                const isJSON = !data.startsWith('<!');
                
                resolve({
                    status: res.statusCode,
                    isJSON: isJSON,
                    data: data.substring(0, 100),
                    contentType: res.headers['content-type']
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeoutId);
            resolve({
                status: 0,
                error: err.message,
                isJSON: false
            });
        });
    });
}

async function runTests() {
    console.clear();
    console.log('═'.repeat(70));
    console.log('🧪 POST-CONFIGURATION VERIFICATION');
    console.log('═'.repeat(70));
    console.log(`Domain: https://${DOMAIN}\n`);
    console.log('Testing all endpoints...\n');

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        process.stdout.write(`[${i + 1}/${tests.length}] ${test.name}... `);
        
        const result = await makeRequest(test.url, test.expectJSON);
        
        if (result.status === 200) {
            if (test.expectJSON) {
                if (result.isJSON) {
                    console.log('✅');
                    passed++;
                } else {
                    console.log('⚠️  (Returns HTML, not JSON)');
                    warnings++;
                    console.log(`       → Content-Type: ${result.contentType}`);
                    console.log(`       → First chars: ${result.data}`);
                    console.log(`       → This likely means reverse proxy isn't configured yet`);
                }
            } else {
                console.log('✅');
                passed++;
            }
        } else if (result.status === 404) {
            console.log('❌ (404 Not Found)');
            failed++;
        } else if (result.error) {
            console.log(`❌ (${result.error})`);
            failed++;
        } else {
            console.log(`❌ (Status: ${result.status})`);
            failed++;
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total Tests: ${tests.length}\n`);

    if (failed === 0 && warnings === 0) {
        console.log('🎉 ALL TESTS PASSED! Your configuration is complete.\n');
        console.log('Your HSC Exam system is now fully operational in production!');
        console.log('\nNext steps:');
        console.log('  1. Test the application at: https://' + DOMAIN);
        console.log('  2. Try creating an account and logging in');
        console.log('  3. Test all features (forms, payments, etc.)');
        console.log('  4. Monitor logs: SSH → pm2 logs\n');
        process.exit(0);
    } else if (warnings > 0 && failed === 0) {
        console.log('⚠️  Configuration partially complete. Reverse proxy needs setup.\n');
        console.log('Action required:');
        console.log('  1. Go to Hostinger cPanel');
        console.log('  2. Set up Reverse Proxy for /api/* → http://127.0.0.1:5000');
        console.log('  3. Run this script again to verify\n');
        process.exit(1);
    } else {
        console.log('❌ Some tests failed. Please check:\n');
        console.log('Checklist:');
        console.log('  ☐ Domain is accessible (ping domain)');
        console.log('  ☐ DNS is pointing to Hostinger (45.130.228.77)');
        console.log('  ☐ Reverse proxy is configured (/api → localhost:5000)');
        console.log('  ☐ Document root is set to /app/frontend');
        console.log('  ☐ SSL certificate is installed');
        console.log('  ☐ Backend (Node.js) is running on port 5000');
        console.log('  ☐ Check Hostinger cPanel → Error Logs\n');
        console.log('Troubleshooting:');
        console.log('  1. SSH into server and check: pm2 status');
        console.log('  2. View logs: pm2 logs');
        console.log('  3. Test direct connection: curl http://127.0.0.1:5000/api/health');
        console.log('  4. Contact Hostinger support if proxy configuration issues persist\n');
        process.exit(1);
    }
}

console.log('Starting tests...');
runTests().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
