import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { env } from '../env.js';

/**
 * Sign access token
 * @param {Object} user - User object with userId, role, instituteId, username
 * @returns {string} JWT access token
 */
export function signAccessToken(user) {
  const expiresIn = env.ACCESS_TOKEN_TTL;
  return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn });
}

/**
 * Sign refresh token
 * @param {Object} user - User object with userId, role, instituteId, username
 * @returns {string} JWT refresh token
 */
export function signRefreshToken(user) {
  const payload = { ...user, typ: 'refresh' };
  const expiresIn = `${env.REFRESH_TOKEN_TTL_DAYS}d`;
  // jwtid makes every refresh token unique, even for two logins in the same second
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn, jwtid: randomUUID() });
}

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Verify refresh token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * bcrypt only looks at the first 72 bytes of its input. Refresh tokens are
 * JWTs whose first 72+ bytes (header + start of payload) are identical for
 * every token of the same user, so hashing the raw JWT made any of a user's
 * tokens match any of their stored hashes — logout could not reliably revoke
 * a session. Pre-hashing with SHA-256 gives bcrypt a 64-char digest that is
 * unique per token.
 * @param {string} token
 * @returns {string}
 */
export function digestToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

/**
 * Hash a refresh token for storage.
 * @param {string} token - Token to hash
 * @returns {Promise<string>} Hashed token
 */
export async function hashToken(token) {
  return bcrypt.hash(digestToken(token), 10);
}

/**
 * Compare a raw token with a stored hash.
 * Hashes written before the SHA-256 pre-hash no longer match, so sessions
 * created before this change simply need to sign in again.
 * @param {string} token - Raw token
 * @param {string} hash - Hashed token
 * @returns {Promise<boolean>} True if match
 */
export async function compareToken(token, hash) {
  return bcrypt.compare(digestToken(token), hash);
}
