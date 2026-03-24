import { Router } from 'express';
import { env } from '../env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    buildId: env.BUILD_ID,
    timestamp: new Date().toISOString()
  });
});

