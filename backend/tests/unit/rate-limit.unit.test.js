import { describe, it, expect } from 'vitest';
import { rateLimitKey } from '../../src/middleware/rate-limit.js';
import { signAccessToken } from '../../src/auth/tokens.js';

describe('rateLimitKey', () => {
  it('keys signed-in requests by user id', () => {
    const token = signAccessToken({ userId: 42, role: 'STUDENT', username: 's' });
    expect(rateLimitKey({ headers: { authorization: `Bearer ${token}` }, ip: '1.2.3.4' })).toBe('user:42');
  });

  it('gives two users behind the same IP separate buckets', () => {
    const a = signAccessToken({ userId: 1, role: 'STUDENT', username: 'a' });
    const b = signAccessToken({ userId: 2, role: 'STUDENT', username: 'b' });
    const ip = '10.0.0.8';
    expect(rateLimitKey({ headers: { authorization: `Bearer ${a}` }, ip }))
      .not.toBe(rateLimitKey({ headers: { authorization: `Bearer ${b}` }, ip }));
  });

  it('falls back to the IP for anonymous requests', () => {
    expect(rateLimitKey({ headers: {}, ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });

  it('ignores forged tokens so they cannot dodge the IP limit', () => {
    expect(rateLimitKey({ headers: { authorization: 'Bearer forged.token.value' }, ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });
});
