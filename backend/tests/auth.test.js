import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestClient, mockData, extractToken, parseJWT } from './setup.js';

describe('Authentication API', () => {
  const client = new TestClient();
  let testUser = null;
  let accessToken = null;

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      testUser = mockData.user();
      const res = await client.post('/api/auth/register', {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject duplicate username', async () => {
      const user = mockData.user();
      // Register first user
      await client.post('/api/auth/register', {
        username: user.username,
        email: user.email,
        password: user.password
      });

      // Try duplicate
      const res = await client.post('/api/auth/register', {
        username: user.username,
        email: 'different' + user.email,
        password: user.password
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/username|already/i);
    });

    it('should reject weak passwords', async () => {
      const res = await client.post('/api/auth/register', {
        username: 'test_weak_' + Date.now(),
        email: 'weak' + Date.now() + '@test.com',
        password: 'weak'
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/password|weak|require/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await client.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');

      accessToken = res.body.accessToken;
      const payload = parseJWT(accessToken);
      expect(payload.userId).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await client.post('/api/auth/login', {
        email: testUser.email,
        password: 'WrongPassword123'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|incorrect|password/i);
    });

    it('should reject non-existent email', async () => {
      const res = await client.post('/api/auth/login', {
        email: 'nonexistent' + Date.now() + '@test.com',
        password: 'SomePassword123'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|not found|user/i);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get refresh token
      const loginRes = await client.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      const refreshToken = loginRes.body.refreshToken;

      // Refresh
      const res = await client.post('/api/auth/refresh', {
        refreshToken
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBe(loginRes.body.accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const res = await client.post('/api/auth/refresh', {
        refreshToken: 'invalid.token.here'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|expired|token/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      client.setAuth(accessToken);
      const res = await client.post('/api/auth/logout', {});

      expect(res.status).toMatch(/200|204/);
    });

    it('should reject logout without token', async () => {
      const res = await client.post('/api/auth/logout', {});

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized|token|required/i);
    });
  });

  describe('POST /api/auth/google (Google SSO)', () => {
    it('should handle invalid Google token gracefully', async () => {
      const res = await client.post('/api/auth/google', {
        credential: 'invalid.google.token.here'
      });

      expect(res.status).toMatch(/400|401/);
      expect(res.body.message).toMatch(/invalid|google|token|verify/i);
    });

    // Note: Full Google SSO test requires real Google token setup
    // This is a basic structure test
  });

  describe('GET /api/me', () => {
    it('should return authenticated user data', async () => {
      client.setAuth(accessToken);
      const res = await client.get('/api/me');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject unauthenticated request', async () => {
      const client2 = new TestClient();
      const res = await client2.get('/api/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized|token|required/i);
    });
  });
});
