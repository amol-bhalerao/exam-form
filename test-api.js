#!/usr/bin/env node
/**
 * Comprehensive API Testing for HSC Exam System
 */

const https = require('https');

const API_BASE = 'https://hsc-exam-form.hisofttechnology.com/api';

// Test endpoints
const tests = [
    {
        name: 'Health Check',
        method: 'GET',
        path: '/health',
        expected: 200
    },
    {
        name: 'Get Colleges',
        method: 'GET',
        path: '/public/colleges',
        expected: 200
    },
    {
        name: 'Get Streams',
        method: 'GET',
        path: '/public/streams',
        expected: 200
    },
    {
        name: 'Get Subjects',
        method: 'GET',
        path: '/public/subjects',
        expected: 200
    },
    {
        name: 'Get Boards',
        method: 'GET',
        path: '/public/boards',
        expected: 200
    }
];

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 10000);

        https.get(url, { rejectUnauthorized: false }, (res) => {
            clearTimeout(timeout);
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function runTests() {
    console.log('🧪 HSC Exam API Testing\n');
    console.log('═'.repeat(60));
    console.log(`Base URL: ${API_BASE}\n`);

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const url = `${API_BASE}${test.path}`;
        
        try {
            console.log(`⏳ ${test.name}...`);
            const response = await makeRequest(url);
            
            if (response.status === test.expected) {
                console.log(`   ✅ Status: ${response.status} (Expected: ${test.expected})`);
                
                // Try to parse JSON response
                try {
                    const jsonData = JSON.parse(response.body);
                    const dataPreview = JSON.stringify(jsonData).substring(0, 80);
                    console.log(`   📦 Response: ${dataPreview}...`);
                } catch (e) {
                    console.log(`   📦 Response: ${response.body.substring(0, 80)}...`);
                }
                
                passed++;
            } else {
                console.log(`   ❌ Status: ${response.status} (Expected: ${test.expected})`);
                failed++;
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
        }
        
        console.log();
    }

    console.log('═'.repeat(60));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed! API is working correctly.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Check the API server status.\n');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
});
