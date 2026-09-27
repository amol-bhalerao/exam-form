import { test, expect } from '@playwright/test';
import { loginWithForm, expectNoHorizontalScroll, setPreference, apiLogin, API } from './helpers';

test.describe('institute portal', () => {
  test.beforeEach(async ({ request }) => {
    await setPreference(request, 'institute1', 'en');
  });
  test.afterAll(async ({ request }) => {
    await setPreference(request, 'institute1', 'en');
  });

  test('signs in and shows the institute menu @responsive', async ({ page, isMobile }) => {
    await loginWithForm(page, '/institute-login', 'institute1');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.locator('nav.nav');
    for (const item of ['Applications', 'Institute details', 'Teachers and staff', 'Stream subjects', 'Exam capacity']) {
      await expect(nav.getByText(item, { exact: true })).toBeVisible();
    }
    await expectNoHorizontalScroll(page);
  });

  test('a wrong password shows a readable message', async ({ page }) => {
    await page.goto('/institute-login');
    await page.locator('input[formcontrolname="username"]').fill('institute1');
    await page.locator('input[formcontrolname="password"]').fill('definitely-wrong');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/institute-login/);
    await expect(page.getByText('INVALID_CREDENTIALS')).toHaveCount(0);
  });

  test('language choice is saved to the account and restored on the next login', async ({ page }) => {
    await loginWithForm(page, '/institute-login', 'institute1');
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/me/preferences') && r.request().method() === 'PUT');
    await page.getByRole('radio', { name: 'हिंदी' }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.locator('nav.nav').getByText('डैशबोर्ड')).toBeVisible();

    // sign out, forget the device choice, sign in again
    await page.getByRole('button', { name: /लॉगआउट|Logout/ }).click();
    await page.evaluate(() => { localStorage.removeItem('language'); localStorage.removeItem('language_explicit'); });
    await loginWithForm(page, '/institute-login', 'institute1');
    await expect(page.locator('nav.nav').getByText('डैशबोर्ड')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });

  test('GR subject guide adds subjects to the exam form and checks the rules', async ({ page, request }) => {
    const { accessToken } = await apiLogin(request, 'institute1');
    const list = await (await request.get(`${API}/api/applications/institute/list`, { headers: { Authorization: `Bearer ${accessToken}` } })).json();
    const app = (list.applications || [])[0];
    await loginWithForm(page, '/institute-login', 'institute1');
    test.skip(!app, 'seed data has no application for institute1');

    await page.goto(`/app/institute/applications/${app.id}`);
    await page.locator('.mat-step-header').nth(4).click();

    const guide = page.locator('app-gr-subject-guide');
    await expect(guide.getByText('Subject guide — 2019 GR scheme')).toBeVisible();
    await expect(guide.locator('.group-title')).toHaveText(['Group A — compulsory', 'Group A — one language / IT / Bifocal Paper I', 'Group B — minimum 3', 'Group C — up to 1']);

    const rowsBefore = await page.locator('.subject-input-group').count();
    const physics = guide.locator('.chip').filter({ has: page.locator('.chip-code', { hasText: /^54$/ }) }).first();
    const alreadySelected = (await physics.getAttribute('aria-pressed')) === 'true';
    const validated = page.waitForResponse((r) => r.url().endsWith('/api/masters/subject-scheme/validate'));
    await physics.click();
    await validated;
    await expect(page.locator('.subject-input-group')).toHaveCount(alreadySelected ? rowsBefore - 1 : rowsBefore + 1);
    await expect(guide.locator('.issues .issue').first()).toBeVisible();
  });

  test('signs out and cannot reuse the old session', async ({ page, request }) => {
    await loginWithForm(page, '/institute-login', 'institute1');
    const refreshToken = await page.evaluate(() => JSON.parse(localStorage.getItem('hsc_auth')!).refreshToken);
    const loggedOut = page.waitForResponse((r) => r.url().endsWith('/api/auth/logout'));
    await page.getByRole('button', { name: 'Logout' }).click();
    await loggedOut;
    await expect(page).toHaveURL(/\/login/);
    const reuse = await request.post('http://localhost:3000/api/auth/refresh', { data: { refreshToken } });
    expect(reuse.status()).toBe(401);
  });
});
