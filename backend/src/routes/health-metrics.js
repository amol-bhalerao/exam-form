import { Router } from 'express';
import { prisma } from '../prisma.js';
import { env } from '../env.js';
import os from 'os';

export const healthMetricsRouter = Router();

/**
 * Get comprehensive system health metrics
 * Public endpoint - no authentication required
 * Used for monitoring and debugging
 */
healthMetricsRouter.get('/status', async (req, res) => {
  try {
    const startTime = Date.now();

    // 1. Database connectivity check
    let dbHealthy = false;
    let dbLatency = null;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbHealthy = true;
    } catch (err) {
      dbHealthy = false;
    }

    // 2. Memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // 3. Active connections
    let activeConnections = 0;
    let totalUsers = 0;
    let totalStudents = 0;
    try {
      activeConnections = await prisma.refreshToken.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      totalUsers = await prisma.user.count();
      totalStudents = await prisma.student.count();
    } catch (err) {
      // DB might be down
    }

    // 4. Session stats
    const sessionStats = {
      activeConnections,
      totalUsers,
      totalStudents,
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        systemTotal: `${Math.round(totalMemory / 1024 / 1024 / 1024)}GB`,
        systemFree: `${Math.round(freeMemory / 1024 / 1024 / 1024)}GB`,
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    };

    // 5. Overall health status
    const responseTime = Date.now() - startTime;
    const isHealthy = dbHealthy && responseTime < 5000;

    res.json({
      timestamp: new Date().toISOString(),
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      database: {
        healthy: dbHealthy,
        latency: `${dbLatency}ms`
      },
      sessions: sessionStats,
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: `${Math.round(process.uptime() / 60)}min`
      },
      version: env.BUILD_ID || 'unknown',
      environment: env.NODE_ENV,
      warnings: generateWarnings(sessionStats, memUsage)
    });
  } catch (err) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'UNHEALTHY',
      error: err.message
    });
  }
});

/**
 * Lightweight health check (used for load balancer)
 */
healthMetricsRouter.get('/ping', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

/**
 * Get session management stats (for admins/monitoring)
 */
healthMetricsRouter.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.refreshToken.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    const activeUsers = sessions.length;
    const totalActiveSessions = sessions.reduce((sum, s) => sum + s._count.id, 0);

    res.json({
      timestamp: new Date().toISOString(),
      activeUsers,
      totalActiveSessions,
      averageSessionsPerUser: (totalActiveSessions / activeUsers).toFixed(2),
      lastHourLogins: await getLastHourLogins(),
      sessionsByRole: await getSessionsByRole()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * API readiness check
 */
healthMetricsRouter.get('/ready', async (req, res) => {
  try {
    const checks = {
      database: false,
      environment: false,
      memory: false
    };

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch { }

    // Environment check
    checks.environment = !!env.GOOGLE_CLIENT_ID && !!env.JWT_SECRET;

    // Memory check (should have at least 10% free)
    const memUsage = process.memoryUsage();
    checks.memory = (memUsage.heapUsed / memUsage.heapTotal) < 0.9;

    const allReady = Object.values(checks).every(v => v);
    res.status(allReady ? 200 : 503).json({
      ready: allReady,
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

/**
 * Get metrics for the last hour
 */
async function getLastHourLogins() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return await prisma.refreshToken.count({
    where: {
      createdAt: { gte: oneHourAgo }
    }
  });
}

/**
 * Get sessions by user role
 */
async function getSessionsByRole() {
  const result = await prisma.refreshToken.groupBy({
    by: ['userId'],
    _count: { id: true },
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  // Get roles for these users
  const users = await prisma.user.findMany({
    where: {
      id: { in: result.map(r => r.userId) }
    },
    select: {
      id: true,
      roleId: true,
      role: { select: { name: true } }
    }
  });

  const roleMap = {};
  users.forEach(user => {
    const role = user.role.name;
    roleMap[role] = (roleMap[role] || 0) + 1;
  });

  return roleMap;
}

/**
 * Generate warnings based on system state
 */
function generateWarnings(stats, memUsage) {
  const warnings = [];

  // Memory warnings
  if (memUsage.heapUsed / memUsage.heapTotal > 0.85) {
    warnings.push('⚠️ High memory usage (>85%)');
  }

  if (stats.activeConnections > 10000) {
    warnings.push('⚠️ High active connections (>10k)');
  }

  // Performance warnings
  if (stats.cpu.loadAverage[0] > stats.cpu.cores) {
    warnings.push('⚠️ CPU load exceeds core count');
  }

  return warnings;
}
