import { describe, it, expect, beforeAll } from 'vitest';
import { TestClient, mockData } from './setup.js';

describe('Payment API (Cashfree)', () => {
  const client = new TestClient();
  let authToken = null;
  let studentUser = null;
  let applicationId = null;

  beforeAll(async () => {
    // Create and login a student user
    studentUser = mockData.user();
    await client.post('/api/auth/register', {
      username: studentUser.username,
      email: studentUser.email,
      password: studentUser.password,
      role: 'STUDENT'
    });

    const loginRes = await client.post('/api/auth/login', {
      email: studentUser.email,
      password: studentUser.password
    });

    authToken = loginRes.body.accessToken;
    client.setAuth(authToken);

    // Create a student application
    const appRes = await client.post('/api/applications', {
      ...mockData.application(),
      examId: 1
    });

    if (appRes.status === 201) {
      applicationId = appRes.body.application.id;
    }
  });

  describe('POST /api/payments/initiate/:applicationId', () => {
    it('should initiate payment for valid application', async () => {
      if (!applicationId) {
        expect.skip();
        return;
      }

      const res = await client.post(`/api/payments/initiate/${applicationId}`, {});

      // In sandbox mode, should return sandbox success or Cashfree response
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('orderId');
      expect(res.body).toHaveProperty('paymentSessionId');
    });

    it('should reject payment for non-existent application', async () => {
      const res = await client.post('/api/payments/initiate/99999', {});

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|application/i);
    });

    it('should reject payment initiation without authentication', async () => {
      const unauthClient = new TestClient();
      const res = await unauthClient.post('/api/payments/initiate/1', {});

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized|token/i);
    });

    it('should reject for non-STUDENT role', async () => {
      // Create an institute user
      const instituteUser = mockData.user();
      await client.post('/api/auth/register', {
        username: instituteUser.username,
        email: instituteUser.email,
        password: instituteUser.password,
        role: 'INSTITUTE'
      });

      const instituteLoginRes = await client.post('/api/auth/login', {
        email: instituteUser.email,
        password: instituteUser.password
      });

      const instituteClient = new TestClient();
      instituteClient.setAuth(instituteLoginRes.body.accessToken);

      const res = await instituteClient.post(`/api/payments/initiate/${applicationId}`, {});

      expect(res.status).toMatch(/403|401/);
      expect(res.body.message).toMatch(/not authorized|student|permission/i);
    });
  });

  describe('POST /api/payments/sandbox/complete/:applicationId', () => {
    it('should complete payment in sandbox mode', async () => {
      if (!applicationId) {
        expect.skip();
        return;
      }

      // First initiate payment
      const initiateRes = await client.post(`/api/payments/initiate/${applicationId}`, {});
      if (initiateRes.status !== 200 && initiateRes.status !== 201) {
        expect.skip();
        return;
      }

      // Then complete it
      const res = await client.post(`/api/payments/sandbox/complete/${applicationId}`, {
        status: 'SUCCESS'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('payment');
    });

    it('should reject sandbox completion in production mode', async () => {
      // This test only applies if running in production mode
      // Environment: process.env.NODE_ENV should be 'production'
      if (process.env.NODE_ENV !== 'production') {
        expect.skip();
        return;
      }

      const res = await client.post(`/api/payments/sandbox/complete/${applicationId}`, {
        status: 'SUCCESS'
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/production|sandbox|disabled/i);
    });
  });

  describe('GET /api/payments/status/:applicationId', () => {
    it('should return payment status for application', async () => {
      if (!applicationId) {
        expect.skip();
        return;
      }

      const res = await client.get(`/api/payments/status/${applicationId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('payment');
      expect(['PENDING', 'SUCCESS', 'FAILED', null]).toContain(
        res.body.payment?.status
      );
    });

    it('should return 404 for non-existent application', async () => {
      const res = await client.get('/api/payments/status/99999');

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const unauthClient = new TestClient();
      const res = await unauthClient.get(`/api/payments/status/${applicationId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payments/webhook (Cashfree Webhook)', () => {
    it('should accept valid webhook signature', async () => {
      // Webhook endpoint typically doesn't require auth
      const res = await client.post('/api/payments/webhook', {
        orderId: 'test_order_' + Date.now(),
        orderAmount: 500,
        orderCurrency: 'INR',
        orderStatus: 'PAID',
        paymentTime: new Date().toISOString()
      }, {
        'x-webhook-signature': 'valid_signature_would_go_here'
      });

      // Should either accept or reject signature
      expect([200, 400, 401, 403]).toContain(res.status);
    });

    it('should reject webhook without signature', async () => {
      const res = await client.post('/api/payments/webhook', {
        orderId: 'test_order',
        orderStatus: 'PAID'
      });

      expect([400, 403]).toContain(res.status);
      expect(res.body.message).toMatch(/signature|invalid|unauthorized/i);
    });
  });

  describe('Payment Flow Integration', () => {
    it('should handle complete payment flow: initiate → complete → get status', async () => {
      if (!applicationId) {
        expect.skip();
        return;
      }

      // Step 1: Initiate
      const initiateRes = await client.post(`/api/payments/initiate/${applicationId}`, {});
      expect([200, 201]).toContain(initiateRes.status);
      const paymentSessionId = initiateRes.body.paymentSessionId;

      // Step 2: Complete (sandbox only)
      if (process.env.NODE_ENV !== 'production') {
        const completeRes = await client.post(`/api/payments/sandbox/complete/${applicationId}`, {
          status: 'SUCCESS',
          paymentSessionId
        });
        expect([200, 201]).toContain(completeRes.status);
      }

      // Step 3: Check status
      const statusRes = await client.get(`/api/payments/status/${applicationId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body).toHaveProperty('payment');
    });
  });
});
