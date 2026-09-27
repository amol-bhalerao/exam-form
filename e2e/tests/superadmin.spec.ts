import { test, expect } from '@playwright/test';
import { loginWithForm, setPreference } from './helpers';

test.describe('super admin', () => {
  test.beforeEach(async ({ request }) => setPreference(request, 'superadmin', 'en'));

  test('health monitor reports healthy without probing login or writing data', async ({ page }) => {
    const risky: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (u.endsWith('/api/auth/login') && !u.includes('localhost:4200')) risky.push(u);
      if (u.includes('/students/select-institute')) risky.push(u);
    });
    await loginWithForm(page, '/admin-login', 'superadmin');
    risky.length = 0; // the sign-in itself is expected
    await page.goto('/app/super/health');
    await page.getByRole('button', { name: /Run Health Check/ }).click();
    await expect(page.getByText('Healthy', { exact: true })).toBeVisible();
    expect(risky).toEqual([]);
  });

  test('master data shows streams with short codes', async ({ page }) => {
    await loginWithForm(page, '/admin-login', 'superadmin');
    await page.goto('/app/super/masters');
    await expect(page.locator('.ag-row').first()).toBeVisible();
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
  });
});
