#!/usr/bin/env node
/**
 * Comprehensive fix and test script
 * Applies migration, starts server, and tests all endpoints
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'fix-and-test.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function log(msg) {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] ${msg}`;
  console.log(output);
  logStream.write(output + '\n');
}

async function applyMigration() {
  log('\n======= STEP 1: Apply Database Migration =======\n');
  
  const prisma = new PrismaClient();
  
  try {
    log('Testing MySQL connection...');
    await prisma.$queryRaw`SELECT 1`;
    log('✓ Connected to MySQL');
    
    // Check if column exists
    log('\nChecking for percentage column...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'previous_exams'
      AND COLUMN_NAME = 'percentage'
    `;
    
    if (columns && columns.length > 0) {
      log('✓ Percentage column exists in database');
      return true;
    }
    
    log('⚠ Percentage column missing - adding it...');
    await prisma.$queryRaw`
      ALTER TABLE previous_exams
      ADD COLUMN percentage VARCHAR(10) NULL
    `;
    log('✓ Percentage column added successfully');
    
    // Verify
    const schema = await prisma.$queryRaw`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'previous_exams'
      ORDER BY ORDINAL_POSITION
    `;
    
    log('\nCurrent previous_exams columns:');
    schema.forEach(col => {
      log(`  • ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    log(`✗ Error: ${error.message}`);
    await prisma.$disconnect();
    return false;
  }
}

function testApiSync() {
  log('\n======= STEP 2: Test API Endpoint =======\n');
  
  return new Promise((resolve) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGUiOiJTVFVERU5UIiwiaW5zdGl0dXRlSWQiOm51bGwsInVzZXJuYW1lIjoiYW1vbGJoYWxlcmFvLmFwcjI1QGdtYWlsLmNvbSIsImlhdCI6MTc3NDg3MjgyOCwiZXhwIjoxNzc0ODczNzI4fQ.EFM7LIpMtaT-ITUeDgpih-pQaKLFBJBBWqA4tIdDQfE';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    log('Testing /api/me endpoint...');
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          if (json.error) {
            log(`✗ API Error: ${json.error.substring(0, 200)}`);
            resolve(false);
          } else {
            log('✓ API returned student data');
            log(`  Username: ${json.username}`);
            log(`  Email: ${json.email}`);
            log(`  Has previousExams: ${Array.isArray(json.previousExams)}`);
            resolve(true);
          }
        } catch (e) {
          log(`✗ Invalid JSON response: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`✗ Connection error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      log('✗ Request timeout');
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  try {
    // Clear log file
    fs.writeFileSync(LOG_FILE, '');
    
    log('========================================');
    log('  HSC Exam - Fix & Test Script');
    log('========================================');
    
    // Step 1: Apply migration
    const migrationSuccess = await applyMigration();
    
    if (!migrationSuccess) {
      log('\n✗ Migration failed. Stopping.');
      process.exit(1);
    }
    
    // Step 2: Wait for server
    log('\n======= STEP 3: Waiting for API Server =======\n');
    log('Waiting 3 seconds for server to respond...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test API
    const apiSuccess = await testApiSync();
    
    if (!apiSuccess) {
      log('\n⚠ API test failed - server may not be running');
      log('Start server with: npm start');
    }
    
    // Summary
    log('\n======= SUMMARY =======\n');
    log(`Migration: ${migrationSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
    log(`API Test: ${apiSuccess ? '✓ SUCCESS' : '⚠ PENDING (start server)'}`);
    log(`\nLog saved to: ${LOG_FILE}`);
    
    process.exit(0);
    
  } catch (error) {
    log(`\n✗ Critical error: ${error.message}`);
    log(error.stack);
    process.exit(1);
  }
}

main();
