import rateLimit from 'express-rate-limit';

/**
 * General API – 500 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
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
 * Payment endpoints – 10 per minute per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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
