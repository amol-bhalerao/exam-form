#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests all endpoints on production
 */

import http from 'http';
import https from 'https';

const BASE_URL = 'https://hsc-api.hisofttechnology.com';
const TEST_TIMEOUT = 10000;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dull: '\x1b[2m'
};

class APITester {
  constructor() {
    this.results = [];
    this.tokens = {};
  }

  /**
   * Make HTTP/HTTPS request
   */
  async request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: TEST_TIMEOUT
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * Test a single endpoint
   */
  async test(name, method, path, body = null, expectedStatus = 200, headers = {}) {
    const fullPath = `/api${path}`;
    const testId = `${method.toUpperCase()} ${fullPath}`;
    
    try {
      const result = await this.request(method, fullPath, body, headers);
      const passed = 
        Array.isArray(expectedStatus) 
          ? expectedStatus.includes(result.status)
          : result.status === expectedStatus;
      
      const status = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      console.log(`${status} ${name}`);
      
      if (!passed) {
        console.log(`  ${colors.yellow}Expected: ${expectedStatus}, Got: ${result.status}${colors.reset}`);
        if (result.body?.error) {
          console.log(`  ${colors.yellow}Error: ${result.body.error}${colors.reset}`);
          if (result.body.message) {
            console.log(`  ${colors.yellow}Message: ${result.body.message}${colors.reset}`);
          }
        }
      }

      this.results.push({
        test: testId,
        name,
        status: result.status,
        expectedStatus,
        passed,
        error: result.body?.error || null
      });

      // Store tokens for authenticated requests
      if (passed && result.body?.token) {
        this.tokens[name] = result.body.token;
      }

      return result;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${name}`);
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
      
      this.results.push({
        test: testId,
        name,
        status: 'ERROR',
        expectedStatus,
        passed: false,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}      HSC EXAM SYSTEM - API TEST SUITE${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────
    console.log(`${colors.blue}📌 PUBLIC ENDPOINTS${colors.reset}`);
    await this.test('Health Check', 'GET', '/health', null, 200);
    await this.test('Root Endpoint', 'GET', '/', null, [200, 404]);
    await this.test('Get All Institutes (Public)', 'GET', '/institutes', null, 200);
    await this.test('Get Public News', 'GET', '/public/news', null, [200, 204]);
    await this.test('Get Pincodes', 'GET', '/pincodes?search=411', null, [200, 404]);

    // ─── AUTH ENDPOINTS ────────────────────────────────────────────────
    console.log(`\n${colors.blue}🔐 AUTH ENDPOINTS${colors.reset}`);
    const signupResult = await this.test(
      'Signup New User',
      'POST',
      '/auth/signup',
      {
        email: `test-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        fullName: 'Test User'
      },
      [201, 400, 409]
    );

    const loginResult = await this.test(
      'Login User',
      'POST',
      '/auth/login',
      {
        username: 'testuser',
        password: 'testpassword'
      },
      [200, 401]
    );

    // ─── MASTERS ENDPOINTS ──────────────────────────────────────────────
    console.log(`\n${colors.blue}📚 MASTERS ENDPOINTS${colors.reset}`);
    await this.test('Get All Subjects', 'GET', '/masters/subjects', null, 200);
    await this.test('Get All Boards', 'GET', '/masters/boards', null, 200);
    await this.test('Get All Streams', 'GET', '/masters/streams', null, 200);
    await this.test('Get All Districts', 'GET', '/masters/districts', null, 200);
    await this.test('Get All News', 'GET', '/news', null, [200, 401]);

    // ─── UNAUTHENTICATED USER ENDPOINTS ────────────────────────────────
    console.log(`\n${colors.blue}👤 USER ENDPOINTS (Unauthenticated)${colors.reset}`);
    await this.test('Get Me (Requires Auth)', 'GET', '/me', null, 401);
    await this.test('Get All Users (Requires Auth)', 'GET', '/users', null, 401);

    // ─── INSTITUTE ENDPOINTS (Requires Auth) ─────────────────────────────
    console.log(`\n${colors.blue}🏫 INSTITUTE ENDPOINTS (Requires Authentication)${colors.reset}`);
    await this.test('Get All Institutes (Admin)', 'GET', '/institutes/all', null, [401, 403, 404]);
    await this.test('Get Institute Users (Admin)', 'GET', '/institutes/users/all', null, [401, 403, 404]);

    // ─── EXAM ENDPOINTS ────────────────────────────────────────────────
    console.log(`\n${colors.blue}📝 EXAM ENDPOINTS${colors.reset}`);
    await this.test('Get All Exams', 'GET', '/exams', null, [200, 401]);
    await this.test('Get Exam By Code', 'GET', '/exams/2024', null, [200, 404]);

    // ─── APPLICATIONS ENDPOINTS ────────────────────────────────────────
    console.log(`\n${colors.blue}📋 APPLICATIONS ENDPOINTS${colors.reset}`);
    await this.test('Get Applications (Requires Auth)', 'GET', '/applications', null, 401);

    // ─── PAYMENT ENDPOINTS ─────────────────────────────────────────────
    console.log(`\n${colors.blue}💳 PAYMENT ENDPOINTS${colors.reset}`);
    await this.test('Get Payments (Requires Auth)', 'GET', '/payments', null, 401);
    await this.test('Get Payment Status (Requires Auth)', 'GET', '/payments/status/test', null, [401, 404]);

    // ─── STUDENT ENDPOINTS ─────────────────────────────────────────────
    console.log(`\n${colors.blue}👨‍🎓 STUDENT ENDPOINTS${colors.reset}`);
    await this.test('Get All Students (Requires Auth)', 'GET', '/students', null, 401);

    // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────
    console.log(`\n${colors.blue}⚙️  ADMIN ENDPOINTS${colors.reset}`);
    await this.test('Admin Dashboard (Requires Auth)', 'GET', '/admin/dashboard', null, 401);
    await this.test('Get Audit Logs (Requires Auth)', 'GET', '/admin/audit-logs', null, 401);

    // ─── MIGRATIONS ENDPOINTS ──────────────────────────────────────────
    console.log(`\n${colors.blue}🔄 MIGRATIONS ENDPOINTS${colors.reset}`);
    await this.test('Get Migrations Status (Requires Auth)', 'GET', '/migrations/status', null, [401, 403]);

    // ─── SUMMARY ────────────────────────────────────────────────────────
    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const passRate = Math.round((passed / total) * 100);

    console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}SUMMARY${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
    console.log(`Pass Rate: ${passRate}%`);

    if (failed > 0) {
      console.log(`\n${colors.yellow}Failed Tests:${colors.reset}`);
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.test}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
    }

    // Check for critical issues
    const criticalIssues = this.results.filter(r => 
      r.error && (
        r.error.includes('does not exist') ||
        r.error.includes('column') ||
        r.error.includes('INTERNAL_ERROR')
      )
    );

    if (criticalIssues.length > 0) {
      console.log(`\n${colors.red}⚠️  CRITICAL ISSUES DETECTED:${colors.reset}`);
      criticalIssues.forEach(issue => {
        console.log(`  ${issue.test}`);
        console.log(`    ${issue.error}`);
      });
    }
  }
}

// Run tests
(async () => {
  const tester = new APITester();
  await tester.runAll();
})().catch(console.error);
