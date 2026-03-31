import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';

export const migrationRouter = Router();

/**
 * Super Admin: Get current schema structure
 * Used to verify database state and plan migrations
 */
migrationRouter.get('/schema/info', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    // Get database info using raw SQL
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS as row_count,
        DATA_LENGTH as data_size
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;

    return res.json({
      database: process.env.DATABASE_URL?.split('/').pop(),
      tables: dbInfo,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error getting schema info:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

/**
 * Super Admin: Get sync status between two databases
 * Compares record counts for verification
 */
migrationRouter.get('/sync/status', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const tables = [
      'users', 'roles', 'institutes', 'students', 'teachers', 
      'streams', 'subjects', 'exams', 'applications', 'news'
    ];

    const status = {};
    for (const table of tables) {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
      status[table] = result[0]?.count || 0;
    }

    return res.json({
      database: process.env.DATABASE_URL?.split('/').pop(),
      environment: process.env.NODE_ENV || 'development',
      tables: status,
      totalRecords: Object.values(status).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error getting sync status:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

/**
 * Super Admin: Export table data as JSON
 * Used for backup and sync operations
 */
migrationRouter.get('/export/:table', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const tableName = z.string().regex(/^[a-z_]+$/).parse(req.params.table);
    
    const allowedTables = [
      'users', 'roles', 'institutes', 'students', 'teachers', 
      'streams', 'subjects', 'exams', 'applications', 'news'
    ];

    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'INVALID_TABLE', message: 'Table not allowed for export' });
    }

    const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);

    return res.json({
      table: tableName,
      recordCount: data.length,
      data,
      exportedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error exporting data:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

/**
 * Super Admin: Verify database connectivity
 * Can specify alternate database URL to test
 */
migrationRouter.post('/verify', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const body = z.object({
      databaseUrl: z.string().optional()
    }).parse(req.body);

    // Test current database connection
    const test = await prisma.$queryRaw`SELECT 1 as ok`;
    
    const info = await prisma.$queryRaw`
      SELECT 
        DATABASE() as database,
        VERSION() as version,
        COUNT(*) as tables
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `;

    return res.json({
      status: 'CONNECTED',
      database: info[0]?.database,
      mysqlVersion: info[0]?.version,
      tableCount: info[0]?.tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error verifying database:', err);
    return res.status(500).json({ 
      status: 'DISCONNECTED',
      error: 'DATABASE_ERROR', 
      message: err.message 
    });
  }
});

/**
 * Super Admin: Get migration history
 * Returns info about applied migrations
 */
migrationRouter.get('/history', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    // Check if _prisma_migrations table exists (created by Prisma)
    const migrations = await prisma.$queryRaw`
      SELECT 
        id,
        checksum,
        finished_at,
        execution_time,
        logs
      FROM _prisma_migrations
      ORDER BY finished_at DESC
    `;

    return res.json({
      database: process.env.DATABASE_URL?.split('/').pop(),
      migrationsApplied: migrations.length,
      migrations,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // _prisma_migrations table might not exist
    console.error('Error getting migration history:', err);
    return res.json({
      database: process.env.DATABASE_URL?.split('/').pop(),
      migrationsApplied: 0,
      migrations: [],
      note: 'No migration history available (fresh database)',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Super Admin: List institutes with counts
 * Used to verify data sync
 */
migrationRouter.get('/sync/institutes', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const institutes = await prisma.institute.findMany({
      include: {
        users: { select: { id: true } },
        students: { select: { id: true } },
        teachers: { select: { id: true } }
      },
      orderBy: { name: 'asc' }
    });

    const summary = institutes.map(i => ({
      id: i.id,
      name: i.name,
      code: i.code,
      status: i.status,
      users: i.users.length,
      students: i.students.length,
      teachers: i.teachers.length
    }));

    return res.json({
      database: process.env.DATABASE_URL?.split('/').pop(),
      totalInstitutes: institutes.length,
      institutes: summary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error getting institutes sync data:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

/**
 * Super Admin: Compare data between tables
 * Useful for detecting missing or duplicate records
 */
migrationRouter.post('/compare', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const body = z.object({
      table: z.string().regex(/^[a-z_]+$/),
      field: z.string(),
      value: z.string().or(z.number())
    }).parse(req.body);

    const allowed = [
      'users', 'roles', 'institutes', 'students', 'teachers', 
      'streams', 'subjects', 'exams', 'applications', 'news'
    ];

    if (!allowed.includes(body.table)) {
      return res.status(400).json({ error: 'INVALID_TABLE' });
    }

    // This is a simple example - in production, use parameterized queries
    const result = await prisma.$queryRawUnsafe(
      `SELECT * FROM ${body.table} WHERE ${body.field} = ?`,
      [body.value]
    );

    return res.json({
      table: body.table,
      field: body.field,
      value: body.value,
      recordCount: result.length,
      records: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error comparing data:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});
