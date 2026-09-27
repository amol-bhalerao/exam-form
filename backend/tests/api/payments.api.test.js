import { describe, it, expect, beforeAll } from 'vitest';
import { serverUp, client, login } from './helpers.js';

describe.skipIf(!serverUp)('Payments API access control', () => {
  let studentToken;
  let boardToken;

  beforeAll(async () => {
    studentToken = (await login('student1')).accessToken;
    boardToken = (await login('board')).accessToken;
  });

  it('requires authentication to start a payment', async () => {
    const res = await client().post('/api/payments/initiate/1', {});
    expect(res.status).toBe(401);
  });

  it('allows only students to start a payment', async () => {
    const res = await client(boardToken).post('/api/payments/initiate/1', {});
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('returns 404 for an application that does not exist', async () => {
    const res = await client(studentToken).post('/api/payments/initiate/999999', {});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('APPLICATION_NOT_FOUND');
  });

  it('lists the student\'s own payments', async () => {
    const res = await client(studentToken).get('/api/payments/my');
    expect(res.status).toBe(200);
  });

  it('keeps the payments dashboard for super admins only', async () => {
    const res = await client(boardToken).get('/api/payments/dashboard');
    expect(res.status).toBe(403);
  });

  it('rate-limits per signed-in user, not per shared IP', async () => {
    // A college lab shares one IP: 25 quick requests from another user must not
    // block this student's next request.
    const other = (await login('institute1')).accessToken;
    for (let i = 0; i < 25; i += 1) await client(other).get('/api/payments/my');
    const res = await client(studentToken).get('/api/payments/my');
    expect(res.status).not.toBe(429);
  });
});
