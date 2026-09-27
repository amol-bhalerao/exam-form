/**
 * Helpers for API tests that run against a live backend + database.
 *
 * Start the backend first (see README "Running tests"), then `npm run test:api`.
 * Seed data comes from database/seed.sql + `npm run db:seed-users`
 * (superadmin / board / institute1 / student1, password Admin@123).
 * When the backend is not reachable these suites are skipped, so
 * `npm run test:unit` and CI without a database still pass.
 */
import { TestClient } from '../setup.js';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
export const SEED_PASSWORD = process.env.TEST_SEED_PASSWORD || 'Admin@123';

async function probe() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const serverUp = await probe();

export function client(token) {
  const c = new TestClient(BASE_URL);
  if (token) c.setAuth(token);
  return c;
}

/** Log in a seeded user and return the full login response body. */
export async function login(username, password = SEED_PASSWORD) {
  const res = await client().post('/api/auth/login', { username, password });
  if (res.status !== 200) {
    throw new Error(`Login for ${username} failed with ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body;
}
