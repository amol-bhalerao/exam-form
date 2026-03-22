import { z } from 'zod';
import { config } from 'dotenv';
// Load environment-specific .env file
if (process.env.NODE_ENV === 'production') {
    config({ path: '.env' });
}
else {
    config({ path: '.env.development' });
}
const envSchema = z.object({
    DATABASE_URL: z.string().min(1).default(process.env.NODE_ENV === 'production'
        ? 'mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam'
        : 'mysql://root:@localhost:3306/hsc_exam_dev'),
    JWT_ACCESS_SECRET: z.string().min(6),
    JWT_REFRESH_SECRET: z.string().min(6),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().min(1).default(process.env.NODE_ENV === 'production' ? 'https://hsc-exam-form.hisofttechnology.com' : 'http://localhost:4200'),
    NODE_ENV: z.string().optional()
});
export const env = envSchema.parse(process.env);
