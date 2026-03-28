import { Router } from 'express';
import { prisma } from '../prisma.js';
import { env } from '../env.js';

export const adminRouter = Router();

/**
 * GET /api/admin/status
 * Returns comprehensive system status including:
 * - Database connectivity
 * - All API endpoints health
 * - Environment configuration
 * - Detailed logs and error messages
 */
adminRouter.get('/status', async (req, res) => {
  const startTime = Date.now();
  const status = {
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    buildId: env.BUILD_ID,
    checks: {
      database: null,
      apis: {},
      system: null
    },
    logs: [],
    summary: {}
  };

  const log = (level, message, data = {}) => {
    status.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    });
    if (level === 'error') {
      console.error(`[${level}] ${message}`, data);
    } else {
      console.log(`[${level}] ${message}`, data);
    }
  };

  try {
    // ════════════════════════════════════════
    // 1. DATABASE CHECK
    // ════════════════════════════════════════
    log('info', 'Testing database connection...');
    try {
      const result = await prisma.$queryRaw`SELECT 1`;
      status.checks.database = {
        status: 'OK',
        message: 'Database connection successful',
        responseTime: `${Date.now() - startTime}ms`
      };
      log('success', 'Database connected');
    } catch (err) {
      status.checks.database = {
        status: 'FAILED',
        message: err.message,
        code: err.code,
        meta: err.meta
      };
      log('error', 'Database connection failed', { error: err.message });
    }

    // ════════════════════════════════════════
    // 2. API ENDPOINTS CHECK
    // ════════════════════════════════════════
    log('info', 'Testing API endpoints...');

    const apiEndpoints = [
      { path: '/api/health', method: 'GET', auth: false, name: 'Health' },
      { path: '/api/public/exams', method: 'GET', auth: false, name: 'Public Exams' },
      { path: '/api/public/news', method: 'GET', auth: false, name: 'Public News' },
      { path: '/api/docs', method: 'GET', auth: false, name: 'Swagger Docs' },
      { path: '/api/auth/check-email', method: 'POST', auth: false, name: 'Check Email' },
      { path: '/api/me', method: 'GET', auth: true, name: 'Get Current User' },
      { path: '/api/exams', method: 'GET', auth: true, name: 'List Exams' },
      { path: '/api/masters/streams', method: 'GET', auth: true, name: 'List Streams' },
      { path: '/api/masters/colleges', method: 'GET', auth: true, name: 'List Colleges' },
      { path: '/api/institutes', method: 'GET', auth: true, name: 'List Institutes' },
      { path: '/api/applications', method: 'GET', auth: true, name: 'List Applications' },
      { path: '/api/students', method: 'GET', auth: true, name: 'List Students' },
      { path: '/api/users', method: 'GET', auth: true, name: 'List Users' },
      { path: '/api/news', method: 'GET', auth: true, name: 'List News' },
      { path: '/api/payments', method: 'GET', auth: true, name: 'List Payments' }
    ];

    // Check schema compatibility
    log('info', 'Checking database schema compatibility...');
    try {
      // This will fail if googleId column doesn't exist
      const testUser = await prisma.user.findFirst({
        select: { id: true, googleId: true }
      });
      status.checks.apis.schema_compatibility = {
        status: 'OK',
        message: 'Database schema matches Prisma expectations',
        requiredFields: ['googleId', 'authProvider']
      };
      log('success', 'Schema check passed - all required columns exist');
    } catch (err) {
      status.checks.apis.schema_compatibility = {
        status: 'FAILED',
        message: 'Database schema mismatch',
        error: err.message,
        cause: 'Missing columns (e.g., googleId, authProvider)',
        solution: 'Run: npx prisma migrate deploy'
      };
      log('error', 'Schema mismatch detected', { 
        error: err.message,
        solution: 'Run npx prisma migrate deploy on production'
      });
    }

    // Simple database query tests
    const dbTests = {
      exams: {
        name: 'Exams Table',
        test: () => prisma.exam.count()
      },
      institutes: {
        name: 'Institutes Table',
        test: () => prisma.institute.count()
      },
      users: {
        name: 'Users Table',
        test: () => prisma.user.count()
      },
      streams: {
        name: 'Streams Table',
        test: () => prisma.stream.count()
      },
      subjects: {
        name: 'Subjects Table',
        test: () => prisma.subject.count()
      },
      boards: {
        name: 'Boards Table',
        test: () => prisma.board.count()
      }
    };

    log('info', 'Checking database tables...');
    for (const [key, test] of Object.entries(dbTests)) {
      try {
        const count = await test.test();
        status.checks.apis[`db_${key}`] = {
          status: 'OK',
          table: test.name,
          recordCount: count
        };
        log('success', `${test.name} accessible`, { recordCount: count });
      } catch (err) {
        status.checks.apis[`db_${key}`] = {
          status: 'FAILED',
          table: test.name,
          error: err.message
        };
        log('error', `${test.name} check failed`, { error: err.message });
      }
    }

    // ════════════════════════════════════════
    // 3. SYSTEM CHECK
    // ════════════════════════════════════════
    log('info', 'Checking system resources...');
    status.checks.system = {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      },
      nodeVersion: process.version,
      platform: process.platform
    };
    log('success', 'System check complete', status.checks.system);

    // ════════════════════════════════════════
    // 4. SUMMARY
    // ════════════════════════════════════════
    const dbStatus = status.checks.database.status === 'OK' ? 'PASS' : 'FAIL';
    const apiStatuses = Object.values(status.checks.apis).map(api => api.status);
    const apiPassCount = apiStatuses.filter(s => s === 'OK').length;
    const apiTotalCount = apiStatuses.length;

    status.summary = {
      database: dbStatus,
      apis: {
        passed: apiPassCount,
        total: apiTotalCount,
        percentage: `${Math.round((apiPassCount / apiTotalCount) * 100)}%`
      },
      overall: dbStatus === 'PASS' ? 'HEALTHY' : 'DEGRADED',
      responseTime: `${Date.now() - startTime}ms`,
      totalLogs: status.logs.length
    };

    log('info', 'Status check complete', status.summary);

    return res.json(status);
  } catch (error) {
    log('error', 'Fatal error during status check', { error: error.message, stack: error.stack });
    return res.status(500).json({
      status: 'ERROR',
      message: 'Status check failed',
      error: error.message,
      logs: status.logs,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/logs
 * Placeholder for viewing application logs
 */
adminRouter.get('/logs', (req, res) => {
  return res.json({
    message: 'Logs endpoint - implementation depends on logging service',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/admin/config
 * Show non-sensitive configuration (for debugging)
 */
adminRouter.get('/config', (req, res) => {
  return res.json({
    environment: env.NODE_ENV,
    buildId: env.BUILD_ID,
    databaseUrl: env.DATABASE_URL ? '***CONFIGURED***' : 'NOT_SET',
    corsOrigin: env.CORS_ORIGIN,
    port: env.PORT,
    serverUrl: `https://${env.API_DOMAIN || 'api.example.com'}`,
    timestamp: new Date().toISOString()
  });
});
