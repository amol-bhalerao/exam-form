import { z } from 'zod';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment-specific .env file when present.
// Hostinger panel variables still win because we never override existing values.
const isProd = process.env.NODE_ENV === 'production';
const envPath = isProd
  ? '.env.production'
  : process.env.NODE_ENV === 'development'
    ? '.env.development'
    : '.env';

if (fs.existsSync(envPath)) {
  config({ path: envPath, override: false });
}

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1).default(
    isProd
      ? 'mysql://u441114691_exam:ExamHSC1234567890@127.0.0.1:3306/u441114691_exam'
      : 'mysql://root:@localhost:3306/hsc_exam_local'
  ),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(6),
  JWT_REFRESH_SECRET: z.string().min(6),
  ACCESS_TOKEN_TTL: z.string().default('60m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // CORS / Origins
  CORS_ORIGIN: z.string().min(1).default(
    isProd ? 'https://hsc-exam-form.hisofttechnology.com' : 'http://localhost:4200'
  ),

  // Google SSO – REQUIRED for Google login to work
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Cashfree Payment Gateway (Sandbox)
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),
  EXAM_FEE_PAISE: z.coerce.number().int().positive().default(50000), // ₹500

  // URLs (used for redirects and webhook base URL)
  BACKEND_URL: z.string().default(isProd ? 'https://hsc-api.hisofttechnology.com' : 'http://localhost:3000'),
  FRONTEND_URL: z.string().default(isProd ? 'https://hsc-exam-form.hisofttechnology.com' : 'http://localhost:4200'),

  // Security – AES-256 key for encrypting sensitive fields (Aadhaar etc)
  ENCRYPTION_KEY: z.string().min(16).optional(),

  BUILD_ID: z.string().default(process.env.BUILD_ID || 'dev-0'),
  NODE_ENV: z.string().optional()
});

export const env = envSchema.parse(process.env);
