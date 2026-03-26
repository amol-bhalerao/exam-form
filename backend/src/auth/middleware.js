import { verifyAccessToken } from './tokens.js';

/**
 * Middleware to require authentication
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
};

/**
 * Middleware to require specific roles
 * @param {string[]} roles - Required roles
 */
export function requireRole(roles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: 'UNAUTHORIZED' });
    if (!roles.includes(role)) return res.status(403).json({ error: 'FORBIDDEN' });
    return next();
  };
}
