import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../env.js';
import type { AuthUser } from '../types.js';

export function signAccessToken(user: AuthUser) {
  const expiresIn = env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'];
  return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn });
}

export function signRefreshToken(user: Pick<AuthUser, 'userId' | 'role' | 'instituteId' | 'username'>) {
  const payload = { ...user, typ: 'refresh' as const };
  const expiresIn = `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as (AuthUser & { typ?: 'refresh' });
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash);
}

