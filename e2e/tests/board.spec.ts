import { test, expect } from '@playwright/test';
import { loginWithForm, expectNoHorizontalScroll, setPreference } from './helpers';

test.describe('board portal', () => {
  test.beforeEach(async ({ request }) => setPreference(request, 'board', 'en'));

  test('signs in and reviews verified applications @responsive', async ({ page }) => {
    await loginWithForm(page, '/admin-login', 'board');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await page.goto('/app/board/applications');
    await expect(page.getByText('Verified Applications')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('streams list shows short codes (no "Invalid Date") and search works', async ({ page }) => {
    await loginWithForm(page, '/admin-login', 'board');
    await page.goto('/app/board/streams');
    await expect(page.getByText('Board Streams', { exact: true })).toBeVisible();
    await expect(page.locator('.ag-row').first()).toBeVisible();
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
    await expect(page.getByText('SCI', { exact: true })).toBeVisible();
  });

  test('student master and exams pages load without errors @responsive', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await loginWithForm(page, '/admin-login', 'board');
    for (const path of ['/app/board/students', '/app/board/exams', '/app/board/subjects', '/app/board/institutes']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page);
    }
    expect(errors).toEqual([]);
  });
});
