import { prisma } from '../prisma.js';

/**
 * Write an audit log entry asynchronously (fire-and-forget, never throws)
 * @param {{ actorUserId: number, action: string, entityType?: string, entityId?: string|number, meta?: object }} params
 */
export async function writeAuditLog({ actorUserId, action, entityType, entityId, meta }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: String(action).substring(0, 100),
        entityType: entityType ? String(entityType).substring(0, 50) : null,
        entityId: entityId != null ? String(entityId).substring(0, 50) : null,
        metaJson: meta ? JSON.stringify(meta) : null
      }
    });
  } catch (err) {
    // Audit log must never break business logic
    console.error('[audit-log] write error:', err?.message ?? err);
  }
}

/**
 * Express middleware – automatically audits state-changing requests for authenticated users.
 * Runs strictly after auth middleware so req.auth is available.
 */
export function auditMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const result = originalJson(body);
    if (req.auth?.userId) {
      const segments = req.path.split('/').filter(Boolean);
      const entityType = segments[0] ?? 'unknown';
      writeAuditLog({
        actorUserId: req.auth.userId,
        action: `${req.method}:${req.originalUrl ?? req.path}`,
        entityType,
        entityId: req.params?.id ?? null,
        meta: { statusCode: res.statusCode, method: req.method }
      });
    }
    return result;
  };
  next();
}
