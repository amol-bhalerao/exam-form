import { describe, it, expect } from 'vitest';
import { serverUp, client, login } from './helpers.js';

describe.skipIf(!serverUp)('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it.each([
      ['student1', 'STUDENT', 'mr'],
      ['institute1', 'INSTITUTE', 'en'],
      ['board', 'BOARD', 'en'],
      ['superadmin', 'SUPER_ADMIN', 'en']
    ])('logs in %s as %s with role default language %s', async (username, role, defaultLanguage) => {
      const body = await login(username);
      expect(body.accessToken).toBeTruthy();
      expect(body.refreshToken).toBeTruthy();
      expect(body.user.username).toBe(username);
      expect(body.user.role).toBe(role);
      expect(body.user.defaultLanguage).toBe(defaultLanguage);
      expect(body.user).toHaveProperty('preferredLanguage');
    });

    it('rejects a wrong password', async () => {
      const res = await client().post('/api/auth/login', { username: 'student1', password: 'wrong-password' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('rejects an unknown user with the same error (no user enumeration)', async () => {
      const res = await client().post('/api/auth/login', { username: 'nobody_' + Date.now(), password: 'Whatever@123' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('rejects a request with missing fields', async () => {
      const res = await client().post('/api/auth/login', {});
      expect(res.status).toBe(422);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('refresh and logout', () => {
    it('issues a new access token for a valid refresh token', async () => {
      const { refreshToken } = await login('student1');
      const res = await client().post('/api/auth/refresh', { refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.username).toBe('student1');
      expect(res.body.user.defaultLanguage).toBe('mr');
    });

    it('rejects a malformed refresh token', async () => {
      const res = await client().post('/api/auth/refresh', { refreshToken: 'not-a-token' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_REFRESH');
    });

    it('revokes only the logged-out session', async () => {
      const first = await login('student1');
      const second = await login('student1');

      const out = await client().post('/api/auth/logout', { refreshToken: first.refreshToken });
      expect(out.status).toBe(200);

      const reuse = await client().post('/api/auth/refresh', { refreshToken: first.refreshToken });
      expect(reuse.status).toBe(401);

      const other = await client().post('/api/auth/refresh', { refreshToken: second.refreshToken });
      expect(other.status).toBe(200);
    });
  });

  describe('POST /api/auth/verify and GET /api/me', () => {
    it('verifies a valid access token', async () => {
      const { accessToken } = await login('student1');
      const res = await client(accessToken).post('/api/auth/verify', {});
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.username).toBe('student1');
    });

    it('returns the signed-in user with language fields', async () => {
      const { accessToken } = await login('institute1');
      const res = await client(accessToken).get('/api/me');
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('institute1');
      expect(res.body.user.defaultLanguage).toBe('en');
    });

    it('rejects an unauthenticated request', async () => {
      const res = await client().get('/api/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('rejects a forged token', async () => {
      const res = await client('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.bad').get('/api/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/google', () => {
    it('validates the credential payload', async () => {
      const res = await client().post('/api/auth/google', { credential: 'short' });
      expect(res.status).toBe(422);
    });

    it('rejects an invalid Google token', async () => {
      const res = await client().post('/api/auth/google', { credential: 'x'.repeat(40) });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});
