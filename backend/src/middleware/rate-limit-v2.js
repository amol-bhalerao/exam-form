import rateLimit from 'express-rate-limit';

/**
 * PRODUCTION RATE LIMITING STRATEGY
 * 
 * For handling large-scale deployments (lakhs/crores of users):
 * 
 * 1. Auth endpoints use skipSuccessfulRequests to not penalize valid logins
 * 2. Identifies users by user ID when authenticated, IP otherwise
 * 3. Different limits for different user types (admin vs student)
 * 4. Allows legitimate apps to work while blocking abuse
 */

/**
 * General API – 500 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
  skip: (req) => {
    // Don't rate limit health checks or public endpoints
    if (req.path === '/health' || req.path === '/health/metrics' || req.path.startsWith('/public')) {
      return true;
    }
    return false;
  }
});

/**
 * Auth endpoints - PRODUCTION OPTIMIZED
 * - Only counts FAILED login attempts (skipSuccessfulRequests: true)
 * - Allows unlimited successful logins
 * - Blocks brute force attacks (max 20 failed per 15 min)
 * - Uses user ID if authenticated, IP otherwise
 * 
 * This solves the "too many auth requests" error for legitimate users
 * while protecting against credential stuffing/brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_AUTH_REQUESTS', message: 'Too many failed authentication attempts. Please wait.' },
  skipSuccessfulRequests: true, // ✅ KEY FIX: Don't count successful logins
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?.userId) {
      return `auth:user:${req.user.userId}`;
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * Student login limiter - more lenient for normal users
 * - 50 failed attempts per hour
 * - Prevents account lockout from network issues
 */
export const studentAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_AUTH_ATTEMPTS', message: 'Too many login attempts. Please try again in 1 hour.' },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // For students, use email or ID
    const email = req.body?.email || req.body?.username;
    return `student:${email || req.ip}`;
  }
});

/**
 * Payment endpoints – 10 per minute per user (production-safe)
 * In production, this prevents accidental double-clicks or rapid retries
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_PAYMENT_REQUESTS', message: 'Payment rate limit exceeded. Please wait before retrying.' },
  keyGenerator: (req) => {
    // Use user ID if authenticated
    if (req.user?.userId) {
      return `payment:user:${req.user.userId}`;
    }
    return `payment:ip:${req.ip}`;
  }
});

/**
 * Upload / heavy operations – 30 per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'UPLOAD_RATE_LIMIT', message: 'Upload rate limit exceeded. Please wait before uploading again.' },
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `upload:user:${req.user.userId}`;
    }
    return `upload:ip:${req.ip}`;
  }
});

/**
 * Form submission limiter - prevents spam submissions
 * - 100 submissions per hour per user
 * - Allows legitimate batch operations
 */
export const formSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'FORM_SUBMIT_LIMIT', message: 'Too many form submissions. Please wait.' },
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `form:user:${req.user.userId}`;
    }
    return `form:ip:${req.ip}`;
  }
});

/**
 * Session manager to track active connections
 * For large-scale deployments, use Redis store instead of memory
 * Currently uses in-memory, but can be swapped for redis-store
 * 
 * npm install redis-store --save
 * Then import and use: import RedisStore from 'redis-store';
 * const sessionStore = new RedisStore({ host: 'redis-server' });
 */
export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  createSession(userId, sessionData) {
    const sessionId = `sess_${userId}_${Date.now()}`;
    this.sessions.set(sessionId, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      ...sessionData
    });

    // Auto-cleanup expired sessions
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, this.sessionTimeout);

    return sessionId;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    this.sessions.delete(sessionId);
    return null;
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  getActiveSessions(userId) {
    const sessions = [];
    for (const [id, session] of this.sessions) {
      if (session.userId === userId && session.expiresAt > Date.now()) {
        sessions.push(id);
      }
    }
    return sessions;
  }

  getStats() {
    let totalSessions = 0;
    let uniqueUsers = new Set();
    let activeCount = 0;

    for (const session of this.sessions.values()) {
      if (session.expiresAt > Date.now()) {
        activeCount++;
        totalSessions++;
        uniqueUsers.add(session.userId);
      }
    }

    return {
      totalActiveSessions: activeCount,
      uniqueActiveUsers: uniqueUsers.size,
      memoryUsageEstimate: `${Math.round(totalSessions * 0.5)}KB` // Rough estimate
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
