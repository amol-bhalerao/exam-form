import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../env.js';
export function signAccessToken(user) {
    const expiresIn = env.ACCESS_TOKEN_TTL;
    return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn });
}
export function signRefreshToken(user) {
    const payload = { ...user, typ: 'refresh' };
    const expiresIn = `${env.REFRESH_TOKEN_TTL_DAYS}d`;
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export async function hashToken(token) {
    return bcrypt.hash(token, 10);
}
export async function compareToken(token, hash) {
    return bcrypt.compare(token, hash);
}
