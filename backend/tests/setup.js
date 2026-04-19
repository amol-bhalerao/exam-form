// Test Setup and Helpers
import { createServer } from 'http';

/**
 * Test HTTP Client - minimal fetch-like interface for testing
 */
export class TestClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async request(method, path, options = {}) {
    const url = new URL(this.baseURL + path);
    const body = options.body ? JSON.stringify(options.body) : null;

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body
    });

    const data = response.ok ? await response.json().catch(() => ({})) : {};
    return {
      status: response.status,
      body: data,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  async get(path, headers = {}) {
    return this.request('GET', path, { headers });
  }

  async post(path, body, headers = {}) {
    return this.request('POST', path, { body, headers });
  }

  async put(path, body, headers = {}) {
    return this.request('PUT', path, { body, headers });
  }

  async patch(path, body, headers = {}) {
    return this.request('PATCH', path, { body, headers });
  }

  async delete(path, headers = {}) {
    return this.request('DELETE', path, { headers });
  }

  /**
   * Set authorization header for subsequent requests
   */
  setAuth(token) {
    this.authToken = token;
  }

  /**
   * Override request to auto-include auth token
   */
  async request(method, path, options = {}) {
    if (this.authToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${this.authToken}`
      };
    }
    return super.request(method, path, options);
  }
}

/**
 * Mock data generators
 */
export const mockData = {
  user: () => ({
    username: 'test_user_' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'Test@1234567'
  }),

  application: () => ({
    studentName: 'Test Student',
    motherName: 'Test Mother',
    fatherName: 'Test Father',
    dob: '2006-06-15',
    gender: 'M',
    category: 'GEN',
    stream: 'SCIENCE',
    medium: 'ENG',
    address: 'Test Address',
    city: 'Test City',
    pin: '123456'
  }),

  exam: () => ({
    name: 'Test Exam ' + Date.now(),
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    formStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    formEndDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED'
  })
};

/**
 * Wait helper for async operations
 */
export const wait = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Extract JWT from response headers or body
 */
export const extractToken = (response) => {
  if (response.body?.accessToken) return response.body.accessToken;
  if (response.headers['authorization']) {
    return response.headers['authorization'].replace('Bearer ', '');
  }
  return null;
};

/**
 * Parse JWT payload (without verification - for testing only)
 */
export const parseJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
};
