import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { env } from './env.js';
import { prisma } from './prisma.js';
import { apiLimiter, authLimiter, paymentLimiter } from './middleware/rate-limit.js';
import { auditMiddleware } from './middleware/audit-log.js';
import { healthRouter } from './routes/health.js';
import { healthMetricsRouter } from './routes/health-metrics.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { institutesRouter } from './routes/institutes.js';
import { examsRouter } from './routes/exams.js';
import { applicationsRouter } from './routes/applications.js';
import { mastersRouter } from './routes/masters.js';
import { usersRouter } from './routes/users.js';
import { publicRouter } from './routes/public.js';
import { newsRouter } from './routes/news.js';
import { paymentsRouter } from './routes/payments.js';
import { studentsRouter } from './routes/students.js';
import { adminRouter } from './routes/admin.js';
import { migrationRouter } from './routes/migrations.js';
import pincodesRouter from './routes/pincodes.js';
import { swaggerSpec } from './swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = env.NODE_ENV === 'production';
const app = express();

// ── Trust proxy (Hostinger, Nginx) ─────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers (Helmet) ───────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://apis.google.com',
          'https://sdk.cashfree.com',
          "'unsafe-inline'" // Angular requires this in dev
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        frameSrc: ["'self'", 'https://accounts.google.com', 'https://sdk.cashfree.com', 'https://sandbox.cashfree.com', 'https://api.cashfree.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://sdk.cashfree.com', 'https://sandbox.cashfree.com', 'https://api.cashfree.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:']
      }
    },
    crossOriginEmbedderPolicy: false, // needed for Google Sign-In
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow Google OAuth popup
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow uploaded student assets to be embedded from the frontend domain
  })
);

// ── CORS ────────────────────────────────────────────────────────────────
const configuredOrigins = String(env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch {
    return origin.replace(/\/+$/, '');
  }
};

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    env.FRONTEND_URL,
    'https://www.hscexam.in',
    'https://hscexam.in',
    'http://localhost:4200',
    'http://localhost:4201'
  ].filter(Boolean).map(normalizeOrigin))
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const normalizedIncomingOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedIncomingOrigin)) return cb(null, true);

      const corsError = new Error(`CORS: origin ${origin} not allowed`);
      corsError.status = 403;
      cb(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-version']
  })
);

// ── Compression (gzip/br) ───────────────────────────────────────────────
app.use(compression());

// ── Structured logging (pino-http) ─────────────────────────────────────
// const httpLogger = pinoHttp({
//   level: isProd ? 'info' : 'debug',
//   transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
//   // Don't log health checks (noisy)
//   autoLogging: { ignore: (req) => req.url === '/api/health' }
// });
// app.use(httpLogger);

// ── Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Handle body parsing errors ──────────────────────────────────────────
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'INVALID_JSON', message: err.message });
  }
  next(err);
});

// Body parser error handler
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'INVALID_JSON', message: 'Invalid JSON in request body' });
  }
  next(err);
});

// ── Global API rate limit ───────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Audit logging for mutating routes ──────────────────────────────────
app.use('/api', auditMiddleware);

// ── Serve Static Frontend Files (Angular Build) ─────────────────────────
// Priority: Serve static files before API routes so assets are cached efficiently.
// Angular may output to either dist/exam-form or dist/exam-form/browser.
const frontendPathCandidates = [
  path.join(__dirname, '../../frontend/dist/exam-form/browser'),
  path.join(__dirname, '../../frontend/dist/exam-form')
];
const frontendPath = frontendPathCandidates.find((candidatePath) =>
  fs.existsSync(path.join(candidatePath, 'index.html'))
) || frontendPathCandidates[0];
const frontendIndexPath = path.join(frontendPath, 'index.html');
const uploadsPath = path.join(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsPath, {
  maxAge: '7d'
}));

app.use(express.static(frontendPath, {
  maxAge: '1d', // Cache assets for 1 day
  dotfiles: 'allow', // Allow serving .htaccess
  setHeaders: (res, filePath) => {
    // Prevent stale index from referencing removed hashed chunks after redeploy.
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return;
    }

    if (/\.(js|css)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// ── SPA Routing: Fallback to index.html for Angular routing ──────────────
// This allows Angular's client-side routing to work for all paths except /api
app.get([
  '/',
  /^\/student.*/,
  /^\/institute.*/,
  /^\/admin.*/
], (_req, res) => {
  res.sendFile(frontendIndexPath);
});

// ── Routes ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ name: 'hsc-exam-backend', ok: true, version: env.BUILD_ID }));

app.use('/api/health', healthRouter);
app.use('/api/health/metrics', healthMetricsRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/me', meRouter);
app.use('/api/institutes', institutesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/masters', mastersRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/public', publicRouter);
app.use('/api/news', newsRouter);
app.use('/api/payments', paymentLimiter, paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/migrations', migrationRouter);
app.use('/api/pincodes', pincodesRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── SPA Fallback: Serve index.html for any unmatched routes ──────────────
// This is critical for Angular's client-side routing when users bookmark or
// directly navigate to non-root paths. Must come after all API routes but before error handler
app.get(/.*/, (_req, res) => {
  res.sendFile(frontendIndexPath);
});

// ── Global error handler (must be last) ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500;

  // Zod validation errors → 422
  if (err?.name === 'ZodError') {
    const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
    return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
  }

  if (!isProd) console.error('[error]', err);

  return res.status(status).json({
    error: err.message ?? 'Internal Server Error',
    ...(!isProd && { stack: err.stack })
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = app.listen(port, () => {
  console.log(`✓ API listening on http://localhost:${port}`);
  console.log(`  Environment : ${env.NODE_ENV ?? 'development'}`);
  console.log(`  Database    : ${env.DATABASE_URL.split('@').pop() ?? 'unknown'}`);
  console.log(`  Google SSO  : ${env.GOOGLE_CLIENT_ID ? 'enabled' : 'not configured'}`);
  console.log(`  Cashfree    : ${env.CASHFREE_APP_ID ? 'enabled' : 'sandbox only'}`);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────
const gracefulShutdown = async () => {
  console.log('\n✓ Shutting down gracefully...');
  
  // Close the HTTP server
  server.close(async () => {
    console.log('✓ HTTP server closed');
    
    // Disconnect Prisma
    try {
      await prisma.$disconnect();
      console.log('✓ Prisma connection closed');
    } catch (err) {
      console.error('✗ Error disconnecting Prisma:', err);
    }
    
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('✗ Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
