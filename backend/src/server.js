import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from './env.js';
import { apiLimiter, authLimiter, paymentLimiter } from './middleware/rate-limit.js';
import { auditMiddleware } from './middleware/audit-log.js';
import { healthRouter } from './routes/health.js';
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
          "'unsafe-inline'" // Angular requires this in dev
        ],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://sandbox.cashfree.com', 'https://api.cashfree.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:']
      }
    },
    crossOriginEmbedderPolicy: false, // needed for Google Sign-In
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Allow Google OAuth popup
  })
);

// ── CORS ────────────────────────────────────────────────────────────────
const allowedOrigins = Array.isArray(env.CORS_ORIGIN)
  ? env.CORS_ORIGIN
  : [env.CORS_ORIGIN, 'http://localhost:4200', 'http://localhost:4201'];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
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

// ── Routes ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ name: 'hsc-exam-backend', ok: true, version: env.BUILD_ID }));

app.use('/api/health', healthRouter);
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
app.listen(port, () => {
  console.log(`✓ API listening on http://localhost:${port}`);
  console.log(`  Environment : ${env.NODE_ENV ?? 'development'}`);
  console.log(`  Database    : ${env.DATABASE_URL.split('@').pop() ?? 'unknown'}`);
  console.log(`  Google SSO  : ${env.GOOGLE_CLIENT_ID ? 'enabled' : 'not configured'}`);
  console.log(`  Cashfree    : ${env.CASHFREE_APP_ID ? 'enabled' : 'sandbox only'}`);
});
