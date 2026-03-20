import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),
    NODE_ENV: z.string().optional()
});
export const env = envSchema.parse(process.env);
