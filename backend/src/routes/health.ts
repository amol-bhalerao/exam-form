import { Router } from 'express';
import { env } from '../env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'hsc-exam-backend',
    version: env.BUILD_ID || 'dev',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime()
  });
});

