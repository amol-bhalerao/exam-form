import { test, expect } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers';

test.describe('public pages', () => {
  test('landing page defaults to Marathi and switches language, remembering the choice @responsive', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'mr');
    await expect(page.getByRole('heading', { name: 'परीक्षा पोर्टलमध्ये आपले स्वागत आहे' })).toBeVisible();

    await page.getByRole('radio', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to Exam Portal' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome to Exam Portal' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('login chooser offers student, institute and board portals @responsive', async ({ page }) => {
    await page.goto('/login');
    for (const name of ['Student', 'Institute', 'Board']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await expectNoHorizontalScroll(page);
  });

  test('policy and contact pages render @responsive', async ({ page }) => {
    for (const [path, heading] of [['/contact-us', 'Contact Us'], ['/terms-and-conditions', 'Terms and Conditions'], ['/refund-policy', 'Refund Policy']]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await expectNoHorizontalScroll(page);
      if (path === '/contact-us') {
        // this button used to render with its label the same colour as the button
        const back = page.getByRole('link', { name: 'Back to Home' });
        await expect(back).toBeVisible();
        const [fg, bg] = await back.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]);
        expect(fg).not.toBe(bg);
      }
    }
  });

  test('document verification explains an unknown number without showing error codes', async ({ page }) => {
    await page.goto('/verify/document/NOT-A-REAL-NUMBER');
    await expect(page.getByText('No document found').first()).toBeVisible();
    await expect(page.getByText('DOCUMENT_NOT_FOUND')).toHaveCount(0);
  });

  test('public health page reaches the API', async ({ page }) => {
    await page.goto('/health');
    await expect(page.getByText('Connected')).toBeVisible();
  });
});
