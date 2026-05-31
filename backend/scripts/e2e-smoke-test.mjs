/**
 * Smoke test: login + core API responses (run with backend on :3000)
 * Usage: node scripts/e2e-smoke-test.mjs
 */
import 'dotenv/config';

const BASE = (process.env.API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function ok(label, res, expectStatus = 200) {
  const pass = res.status === expectStatus;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label} → ${res.status}`);
  if (!pass) console.log('  ', JSON.stringify(res.json).slice(0, 300));
  return pass;
}

async function main() {
  console.log('API smoke test against', BASE);

  const health = await request('GET', '/health');
  ok('GET /health', health);

  const login = await request('POST', '/auth/login', {
    body: { username: 'student1', password: 'Admin@123' }
  });
  if (!ok('POST /auth/login (student1)', login)) {
    console.log('\nTip: run npm run db:seed-users in backend/');
    process.exitCode = 1;
    return;
  }

  const studentToken = login.json.accessToken;

  const streams = await request('GET', '/masters/streams', { token: studentToken });
  ok('GET /masters/streams', streams);

  const managed = await request('GET', '/students/managed', { token: studentToken });
  ok('GET /students/managed', managed);

  const boardLogin = await request('POST', '/auth/login', {
    body: { username: 'board', password: 'Admin@123' }
  });
  if (ok('POST /auth/login (board)', boardLogin)) {
    const boardToken = boardLogin.json.accessToken;
    const exams = await request('GET', '/exams', { token: boardToken });
    ok('GET /exams', exams);

    const boardExams = await request('GET', '/applications/board/exams', { token: boardToken });
    ok('GET /applications/board/exams', boardExams);
  }

  const instLogin = await request('POST', '/auth/login', {
    body: { username: 'institute1', password: 'Admin@123' }
  });
  if (ok('POST /auth/login (institute1)', instLogin)) {
    const instToken = instLogin.json.accessToken;
    const list = await request('GET', '/applications/institute/list', { token: instToken });
    ok('GET /applications/institute/list', list);
  }

  console.log('\nSmoke test finished.');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
