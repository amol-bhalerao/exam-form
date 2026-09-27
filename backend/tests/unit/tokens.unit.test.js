import { describe, it, expect } from 'vitest';
import { signRefreshToken, hashToken, compareToken, digestToken, signAccessToken, verifyAccessToken } from '../../src/auth/tokens.js';

describe('refresh token hashing', () => {
  const user = { userId: 5, role: 'STUDENT', instituteId: 1, username: 'student1' };

  it('produces a fixed-length SHA-256 digest', () => {
    expect(digestToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(digestToken('abc')).toBe(digestToken('abc'));
  });

  it('matches the token it was made from', async () => {
    const token = signRefreshToken(user);
    const hash = await hashToken(token);
    expect(await compareToken(token, hash)).toBe(true);
  });

  it('does not match another token of the same user (bcrypt 72-byte limit)', async () => {
    const a = signRefreshToken({ ...user, n: 1 });
    const b = signRefreshToken({ ...user, n: 2 });
    // Both JWTs share far more than 72 leading bytes
    expect(a.slice(0, 72)).toBe(b.slice(0, 72));
    const hashA = await hashToken(a);
    expect(await compareToken(b, hashA)).toBe(false);
  });

  it('makes every refresh token unique, even within the same second', () => {
    expect(signRefreshToken(user)).not.toBe(signRefreshToken(user));
  });

  it('round-trips access tokens', () => {
    const token = signAccessToken(user);
    expect(verifyAccessToken(token)).toMatchObject(user);
  });
});
