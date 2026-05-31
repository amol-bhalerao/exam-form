import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestClient } from './setup.js';

describe('TestClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends JSON requests and parses JSON responses', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }));
    globalThis.fetch = fetchMock;

    const client = new TestClient('http://example.test');
    const response = await client.post('/api/example', { name: 'Student' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Student' })
    });
  });

  it('includes the bearer token after setAuth is called', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock;

    const client = new TestClient('http://example.test');
    client.setAuth('test-token');
    await client.get('/api/me');

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token'
      },
      body: null
    });
  });
});
