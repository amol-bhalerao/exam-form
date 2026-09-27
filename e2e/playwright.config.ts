import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the real backend + MySQL and the built frontend.
 * See e2e/README.md for the one-time database setup.
 */
const API = process.env.E2E_API_URL || 'http://localhost:3000';
const APP = process.env.E2E_APP_URL || 'http://localhost:4200';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: APP,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] }, grep: /@responsive/ }
  ],
  webServer: [
    {
      command: 'npm --prefix ../backend start',
      url: `${API}/api/health`,
      reuseExistingServer: true,
      timeout: 60_000,
      env: { NODE_ENV: 'development' }
    },
    {
      command: 'node serve-dist.mjs',
      url: APP,
      reuseExistingServer: true,
      timeout: 30_000
    }
  ]
});
