import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './env.js';
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
import { swaggerSpec } from './swagger.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ name: 'hsc-exam-backend', ok: true }));
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/institutes', institutesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/masters', mastersRouter);
app.use('/api/users', usersRouter);
app.use('/api/public', publicRouter);
app.use('/api/news', newsRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global error handler - must be last middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Error:', err.message || err);
  
  // Return JSON error response instead of HTML
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const port = 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Environment: ${env.NODE_ENV || 'development'}`);
  // eslint-disable-next-line no-console
  console.log(`Database: ${env.DATABASE_URL.split('@')[1] || 'unknown'}`);
});

