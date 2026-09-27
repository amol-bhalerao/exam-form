import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { verifyAccessToken } from '../auth/tokens.js';

/**
 * Rate-limit key: the signed-in user when the request carries a valid access
 * token, otherwise the client IP. Many students fill forms from one college
 * lab behind a single public IP, so per-IP limits alone would block them all.
 * Only verified tokens count, so random Bearer values cannot dodge the IP limit.
 */
export function rateLimitKey(req) {
  const header = String(req.headers?.authorization || '');
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(header.slice(7));
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch {
      /* invalid or expired token: fall back to IP */
    }
  }
  return `ip:${ipKeyGenerator(req.ip || '')}`;
}

/**
 * General API – 500 requests per 15 minutes per signed-in user (per IP when anonymous)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }
});

/**
 * Auth endpoints – disabled for local dev, 20 per 15 minutes in production
 * Only counts FAILED attempts (skipSuccessfulRequests: true) to allow multiple valid logins
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_AUTH_REQUESTS', message: 'Too many authentication attempts. Please wait.' },
  skipSuccessfulRequests: true
});

/**
 * Payment endpoints – 20 per minute per signed-in user (per IP when anonymous)
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_PAYMENT_REQUESTS', message: 'Payment rate limit exceeded. Please wait.' }
});

/**
 * Upload / heavy operations – 30 per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'UPLOAD_RATE_LIMIT', message: 'Upload rate limit exceeded. Please wait.' }
});
