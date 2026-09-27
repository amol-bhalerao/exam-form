import { test, expect } from '@playwright/test';
import { apiLogin, useSession, expectNoHorizontalScroll, setPreference } from './helpers';

// Students sign in with Google in the UI, so these tests start from a real
// API session for the seeded student.
test.describe('student portal', () => {
  test.beforeEach(async ({ page, request }) => {
    await setPreference(request, 'student1', 'mr');
    await useSession(page, await apiLogin(request, 'student1'), 'mr');
  });

  test('dashboard greets the student in Marathi by default @responsive', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.getByText('Welcome back, student1!')).toBeVisible();
    await expect(page.locator('.context-title')).toHaveText('विद्यार्थी पोर्टल');
    await expectNoHorizontalScroll(page);
  });

  test('lists exam forms and opens one @responsive', async ({ page }) => {
    const apps = page.waitForResponse((r) => r.url().endsWith('/api/applications/my'));
    await page.goto('/app/student/applications');
    const list = await (await apps).json();
    const app = list.applications[0];
    await expect(page.getByText(app.applicationNo).first()).toBeVisible();
    await page.goto(`/app/student/applications/${app.id}`);
    await expect(page.getByText(`Application ${app.applicationNo}`)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('exam schedule and payments pages render @responsive', async ({ page }) => {
    await page.goto('/app/student/exam-schedule');
    await expect(page.getByText('Exam Schedule', { exact: true })).toBeVisible();
    await page.goto('/app/student/payments');
    await expect(page.getByText('My Payments')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('students cannot open staff pages', async ({ page }) => {
    await page.goto('/app/board/applications');
    await expect(page).not.toHaveURL(/board\/applications/);
  });
});
