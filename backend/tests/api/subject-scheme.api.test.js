import { describe, it, expect, beforeAll } from 'vitest';
import { serverUp, client, login } from './helpers.js';

describe.skipIf(!serverUp)('2019 GR subject scheme API', () => {
  let token;
  let science;
  const idOf = (code) => {
    for (const g of science.groups) for (const s of g.subjects) if (s.code === code) return s.subjectId;
    return null;
  };

  beforeAll(async () => {
    token = (await login('student1')).accessToken;
    const res = await client().get('/api/masters/subject-scheme?stream=1');
    science = res.body;
  });

  it('describes the Science scheme publicly', () => {
    expect(science.stream).toBe('SCIENCE');
    expect(science.reference).toMatch(/2019/);
    expect(science.groups.map((g) => g.key)).toEqual(['A', 'A_CHOICE', 'B', 'C']);
    expect(science.rules.length).toBeGreaterThan(0);
    expect(science.rules[0]).toHaveProperty('mr');
  });

  it('links scheme subjects to database subject ids (deploy-time GR sync)', () => {
    for (const code of ['1', '2', '30', '31', '54', '55', '56', '40']) {
      expect(idOf(code), `subject ${code}`).toEqual(expect.any(Number));
    }
  });

  it('accepts stream names as well as student stream codes', async () => {
    const res = await client().get('/api/masters/subject-scheme?stream=Commerce');
    expect(res.status).toBe(200);
    expect(res.body.stream).toBe('COMMERCE');
  });

  it('returns no groups for streams outside the GR (Technology)', async () => {
    const res = await client().get('/api/masters/subject-scheme?stream=5');
    expect(res.status).toBe(200);
    expect(res.body.stream).toBeNull();
    expect(res.body.groups).toEqual([]);
  });

  it('requires a stream', async () => {
    const res = await client().get('/api/masters/subject-scheme');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('STREAM_REQUIRED');
  });

  it('validates a complete Science selection as OK', async () => {
    const subjectIds = ['1', '2', '30', '31', '54', '55', '56', '40'].map(idOf);
    const res = await client(token).post('/api/masters/subject-scheme/validate', { stream: '1', subjectIds });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.summary.papers).toBe(8);
    expect(res.body.errors).toEqual([]);
  });

  it('explains what is missing, in all three languages', async () => {
    const subjectIds = ['1', '2', '30', '31', '54', '55'].map(idOf);
    const res = await client(token).post('/api/masters/subject-scheme/validate', { stream: '1', subjectIds });
    expect(res.body.ok).toBe(false);
    const codes = res.body.errors.map((e) => e.code);
    expect(codes).toContain('GROUP_B_MIN');
    for (const e of res.body.errors) {
      expect(e.message.en).toBeTruthy();
      expect(e.message.mr).toBeTruthy();
      expect(e.message.hi).toBeTruthy();
    }
  });

  it('flags a missing compulsory subject', async () => {
    const subjectIds = ['2', '30', '31', '54', '55', '56', '40'].map(idOf);
    const res = await client(token).post('/api/masters/subject-scheme/validate', { stream: '1', subjectIds });
    expect(res.body.errors.map((e) => e.code)).toContain('COMPULSORY_MISSING');
  });

  it('requires authentication to validate', async () => {
    const res = await client().post('/api/masters/subject-scheme/validate', { stream: '1', subjectIds: [] });
    expect(res.status).toBe(401);
  });
});
