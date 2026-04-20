import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

const templatePath = path.join(frontendRoot, 'src/environments/environment.prod.template.ts');
const outputPath = path.join(frontendRoot, 'src/environments/environment.prod.ts');

if (!fs.existsSync(templatePath)) {
  console.error(`Missing template file: ${templatePath}`);
  process.exit(1);
}

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const apiBaseUrl = normalizeBaseUrl(
  process.env.FRONTEND_API_BASE_URL || process.env.BACKEND_URL || 'https://api.hscexam.in'
);

const googleClientId =
  (process.env.GOOGLE_CLIENT_ID ||
    process.env.FRONTEND_GOOGLE_CLIENT_ID ||
    '260515642590-5ipgojov7maa51m9j8hutpcu01dckkui.apps.googleusercontent.com')
    .trim();

const template = fs.readFileSync(templatePath, 'utf8');
const rendered = template
  .replace(/__API_BASE_URL__/g, apiBaseUrl)
  .replace(/__GOOGLE_CLIENT_ID__/g, googleClientId);

fs.writeFileSync(outputPath, rendered, 'utf8');
console.log(`Generated ${outputPath} with apiBaseUrl=${apiBaseUrl}`);
console.log(`Google client ID configured: ${googleClientId}`);
