import { expect, Page, APIRequestContext } from '@playwright/test';

export const API = process.env.E2E_API_URL || 'http://localhost:3000';
export const PASSWORD = process.env.E2E_SEED_PASSWORD || 'Admin@123';

export async function apiLogin(request: APIRequestContext, username: string) {
  const res = await request.post(`${API}/api/auth/login`, { data: { username, password: PASSWORD } });
  expect(res.status(), `login ${username}`).toBe(200);
  return res.json();
}

/** Put a real session into the browser (used for students, who sign in with Google in the UI). */
export async function useSession(page: Page, session: any, language = 'en') {
  await page.addInitScript(([s, lang]) => {
    localStorage.setItem('hsc_auth', JSON.stringify({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }));
    localStorage.setItem('language', lang);
  }, [session, language] as const);
}

export async function setPreference(request: APIRequestContext, username: string, language: 'mr' | 'en' | 'hi') {
  const { accessToken } = await apiLogin(request, username);
  await request.put(`${API}/api/me/preferences`, { data: { language }, headers: { Authorization: `Bearer ${accessToken}` } });
}

/** Fails if the page scrolls sideways on the current viewport. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const pane = document.querySelector('mat-sidenav-content') as HTMLElement | null;
    const doc = document.documentElement.scrollWidth - window.innerWidth;
    const inner = pane ? pane.scrollWidth - pane.clientWidth : 0;
    return Math.max(doc, inner);
  });
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

export async function loginWithForm(page: Page, path: '/institute-login' | '/admin-login', username: string) {
  await page.goto(path);
  await page.locator('input[formcontrolname="username"]').fill(username);
  await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/app\//);
}
