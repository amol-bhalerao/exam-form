import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
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
 * Hash token using bcrypt
 * @param {string} token - Token to hash
 * @returns {Promise<string>} Hashed token
 */
export async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

/**
 * Compare token with hash
 * @param {string} token - Raw token
 * @param {string} hash - Hashed token
 * @returns {Promise<boolean>} True if match
 */
export async function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}
