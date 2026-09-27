import { describe, it, expect, afterAll } from 'vitest';
import { serverUp, client, login } from './helpers.js';

describe.skipIf(!serverUp)('Language preference API', () => {
  let studentToken;

  afterAll(async () => {
    // leave the seed user on its role default for other suites
    if (studentToken) await client(studentToken).put('/api/me/preferences', { language: 'mr' });
  });

  it('returns the role default before anything is saved', async () => {
    const { accessToken } = await login('board');
    const res = await client(accessToken).get('/api/me/preferences');
    expect(res.status).toBe(200);
    expect(res.body.defaultLanguage).toBe('en');
    expect(['mr', 'en', 'hi']).toContain(res.body.language);
  });

  it('saves Hindi and returns it on the next login', async () => {
    studentToken = (await login('student1')).accessToken;
    const put = await client(studentToken).put('/api/me/preferences', { language: 'hi' });
    expect(put.status).toBe(200);
    expect(put.body.language).toBe('hi');

    const again = await login('student1');
    expect(again.user.preferredLanguage).toBe('hi');

    const me = await client(again.accessToken).get('/api/me');
    expect(me.body.user.preferredLanguage).toBe('hi');
  });

  it('normalises codes such as "EN-in"', async () => {
    const put = await client(studentToken).put('/api/me/preferences', { language: 'EN-in' });
    expect(put.status).toBe(200);
    expect(put.body.language).toBe('en');
  });

  it('rejects unsupported languages', async () => {
    const put = await client(studentToken).put('/api/me/preferences', { language: 'fr' });
    expect(put.status).toBe(400);
    expect(put.body.error).toBe('UNSUPPORTED_LANGUAGE');
    expect(put.body.supported).toEqual(['mr', 'en', 'hi']);
  });

  it('requires authentication', async () => {
    const res = await client().put('/api/me/preferences', { language: 'en' });
    expect(res.status).toBe(401);
  });
});
