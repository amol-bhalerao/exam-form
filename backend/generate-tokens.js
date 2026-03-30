#!/usr/bin/env node
/**
 * Token Generator for Testing
 * Creates fresh access and refresh tokens for testing without needing real login
 */

import jwt from 'jsonwebtoken';
import { env } from './src/env.js';

function generateTokens(userId = 6, role = 'STUDENT', username = 'amolbhalerao.apr25@gmail.com') {
  console.log('\n📋 Generating Fresh Test Tokens...\n');

  const payload = {
    userId,
    role,
    instituteId: null,
    username
  };

  // Generate access token (60 minutes)
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '60m' });
  
  // Generate refresh token (30 days)
  const refreshToken = jwt.sign(
    { ...payload, typ: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  console.log('✅ Fresh Tokens Generated\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nAccess Token (Expires in 60 minutes):');
  console.log('─'.repeat(60));
  console.log(accessToken);
  console.log('\nRefresh Token (Expires in 30 days):');
  console.log('─'.repeat(60));
  console.log(refreshToken);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Decode and show payload
  const decoded = jwt.decode(accessToken);
  console.log('Token Payload:');
  console.log('─'.repeat(60));
  console.log(`  userId: ${decoded.userId}`);
  console.log(`  role: ${decoded.role}`);
  console.log(`  username: ${decoded.username}`);
  console.log(`  issued at: ${new Date(decoded.iat * 1000).toISOString()}`);
  console.log(`  expires at: ${new Date(decoded.exp * 1000).toISOString()}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  console.log('💡 How to Use:\n');
  console.log('1. Copy the access token above');
  console.log('2. Use it in your API request:\n');
  console.log('   curl -H "Authorization: Bearer <ACCESS_TOKEN>" \\');
  console.log('     http://localhost:3000/api/students/me\n');
  console.log('3. Or in your frontend:\n');
  console.log('   localStorage.setItem("accessToken", "' + accessToken.substring(0, 20) + '...")');
  console.log('   localStorage.setItem("refreshToken", "' + refreshToken.substring(0, 20) + '...")\n');

  console.log('🔄 Save the Refresh Token for later:\n');
  console.log('   curl -X POST http://localhost:3000/api/auth/refresh \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"refreshToken":"' + refreshToken.substring(0, 20) + '..."}\'\n');

  return { accessToken, refreshToken };
}

// For custom user IDs - usage: node generate-tokens.js 6 STUDENT email@example.com
const userId = parseInt(process.argv[2]) || 6;
const role = process.argv[3] || 'STUDENT';
const username = process.argv[4] || 'amolbhalerao.apr25@gmail.com';

generateTokens(userId, role, username);
