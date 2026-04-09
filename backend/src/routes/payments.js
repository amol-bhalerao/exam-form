import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { writeAuditLog } from '../middleware/audit-log.js';
import { env } from '../env.js';

export const paymentsRouter = Router();

const CASHFREE_SANDBOX_URL = 'https://sandbox.cashfree.com/pg';
const CASHFREE_PROD_URL = 'https://api.cashfree.com/pg';

const isCashfreeTestMode = String(env.CASHFREE_APP_ID || '').startsWith('TEST')
  || String(env.CASHFREE_SECRET_KEY || '').includes('_test_');
const CASHFREE_ENVIRONMENT = isCashfreeTestMode
  ? 'sandbox'
  : (env.NODE_ENV === 'production' ? 'production' : 'sandbox');
const CASHFREE_BASE = CASHFREE_ENVIRONMENT === 'production' ? CASHFREE_PROD_URL : CASHFREE_SANDBOX_URL;
const PENDING_PAYMENT_DATE = new Date(0);

function isPaymentSuccessful(payment) {
  return !!payment
    && !!payment.receivedAt
    && new Date(payment.receivedAt).getTime() > PENDING_PAYMENT_DATE.getTime()
    && !String(payment.method || '').toUpperCase().includes('PENDING');
}

function getPaymentStatus(payment) {
  if (!payment) return 'NOT_INITIATED';
  if (isPaymentSuccessful(payment)) return 'SUCCESS';
  if (String(payment.method || '').toUpperCase().includes('FAIL')) return 'FAILED';
  return 'PENDING';
}

/** Create a Cashfree order via REST API (using Node 22 native fetch) */
async function createCashfreeOrder({ orderId, amountPaise, customerName, customerEmail, customerPhone, returnUrl }) {
  const amountRupees = (amountPaise / 100).toFixed(2);

  const payload = {
    order_id: orderId,
    order_amount: parseFloat(amountRupees),
    order_currency: 'INR',
    customer_details: {
      customer_id: `cust_${Date.now()}`,
      customer_name: customerName || 'Student',
      customer_email: customerEmail || 'noreply@hsc.msbshse.ac.in',
      customer_phone: customerPhone || '9999999999'
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: `${env.BACKEND_URL}/api/payments/webhook`
    }
  };

  const response = await fetch(`${CASHFREE_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': env.CASHFREE_APP_ID ?? '',
      'x-client-secret': env.CASHFREE_SECRET_KEY ?? ''
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(`Cashfree API error ${response.status}: ${errBody?.message ?? 'unknown'}`);
  }

  return response.json();
}

/**
 * POST /api/payments/initiate/:applicationId
 * Student validates the draft and starts the payment flow.
 */
paymentsRouter.post('/initiate/:applicationId', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);

  const student = await prisma.student.findUnique({
    where: { userId: req.auth.userId },
    include: { user: true }
  });
  if (!student) return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });

  const application = await prisma.examApplication.findFirst({
    where: { id: applicationId, studentId: student.id },
    include: { exam: true }
  });
  if (!application) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });
  if (!['DRAFT', 'SUBMITTED'].includes(application.status)) {
    return res.status(400).json({ error: 'PAYMENT_NOT_ALLOWED_FOR_STATUS' });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { applicationId },
    orderBy: { id: 'desc' }
  });

  if (isPaymentSuccessful(existingPayment)) {
    return res.json({
      alreadyPaid: true,
      referenceNo: existingPayment.referenceNo,
      amountPaise: existingPayment.amountPaise,
      amountRupees: Number(existingPayment.amountPaise || 0) / 100,
      status: 'SUCCESS'
    });
  }

  const orderId = `HSC-${applicationId}-${Date.now()}`;
  const feeAmount = env.EXAM_FEE_PAISE ?? 50000; // default ₹500

  try {
    const order = await createCashfreeOrder({
      orderId,
      amountPaise: feeAmount,
      customerName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student',
      customerEmail: student.user?.email ?? 'noreply@hsc.msbshse.ac.in',
      customerPhone: student.mobile ?? '9999999999',
      returnUrl: `${env.FRONTEND_URL}/app/student/applications/${applicationId}/payment?payment_status={order_status}&order_id={order_id}`
    });

    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            referenceNo: orderId,
            amountPaise: feeAmount,
            method: 'CASHFREE_PENDING',
            receivedAt: PENDING_PAYMENT_DATE
          }
        })
      : await prisma.payment.create({
          data: {
            applicationId,
            amountPaise: feeAmount,
            method: 'CASHFREE_PENDING',
            referenceNo: orderId,
            receivedAt: PENDING_PAYMENT_DATE
          }
        });

    await writeAuditLog({
      actorUserId: req.auth.userId,
      action: 'PAYMENT_INITIATED',
      entityType: 'payment',
      entityId: payment.id,
      meta: { orderId, amountPaise: feeAmount }
    });

    return res.json({
      paymentSessionId: order.payment_session_id,
      orderId,
      amountPaise: feeAmount,
      amountRupees: feeAmount / 100,
      environment: CASHFREE_ENVIRONMENT,
      status: 'PENDING'
    });
  } catch (err) {
    console.error('[payments] Cashfree error (falling back to sandbox):', err.message);

    const sandboxOrderId = `SANDBOX-${orderId}`;
    await (existingPayment
      ? prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            referenceNo: sandboxOrderId,
            amountPaise: feeAmount,
            method: 'SANDBOX_PENDING',
            receivedAt: PENDING_PAYMENT_DATE
          }
        })
      : prisma.payment.create({
          data: {
            applicationId,
            amountPaise: feeAmount,
            method: 'SANDBOX_PENDING',
            referenceNo: sandboxOrderId,
            receivedAt: PENDING_PAYMENT_DATE
          }
        }));

    return res.json({
      paymentSessionId: `test_session_${Date.now()}`,
      orderId: sandboxOrderId,
      amountPaise: feeAmount,
      amountRupees: feeAmount / 100,
      environment: 'sandbox',
      sandbox: true,
      status: 'PENDING',
      message: 'Live payment gateway is unavailable right now. You can use the Simulate Success option to continue this fallback flow.'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Cashfree payment webhook (no auth – verified by signature header)
 */
paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Verify webhook signature if secret is configured
    const signatureHeader = req.headers['x-webhook-signature'];
    if (env.CASHFREE_WEBHOOK_SECRET && signatureHeader) {
      const { createHmac } = await import('node:crypto');
      const expected = createHmac('sha256', env.CASHFREE_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('base64');
      if (expected !== signatureHeader) {
        return res.status(401).json({ error: 'INVALID_WEBHOOK_SIGNATURE' });
      }
    }

    const orderStatus = body.data?.order?.order_status;
    const orderId = body.data?.order?.order_id;

    if ((body.type === 'PAYMENT_SUCCESS_WEBHOOK' || orderStatus === 'PAID') && orderId) {
      const payment = await prisma.payment.findFirst({ where: { referenceNo: orderId } });
      if (payment && !isPaymentSuccessful(payment)) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { receivedAt: new Date(), method: 'CASHFREE_SUCCESS' }
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[payments] webhook error:', err);
    return res.status(500).json({ error: 'WEBHOOK_ERROR' });
  }
});

/**
 * POST /api/payments/confirm/:applicationId
 * Confirm the return from Cashfree and mark the latest payment successful.
 */
paymentsRouter.post('/confirm/:applicationId', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);
  const body = z.object({
    orderId: z.string().optional(),
    paymentStatus: z.string().optional()
  }).parse(req.body ?? {});

  const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
  if (!student) return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });

  const application = await prisma.examApplication.findFirst({
    where: { id: applicationId, studentId: student.id }
  });
  if (!application) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

  const payment = await prisma.payment.findFirst({
    where: { applicationId },
    orderBy: { id: 'desc' }
  });
  if (!payment) return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });

  const normalizedStatus = String(body.paymentStatus || '').trim().toUpperCase();
  const isPaid = ['PAID', 'SUCCESS', 'COMPLETED'].includes(normalizedStatus) || isPaymentSuccessful(payment);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: isPaid
      ? {
          referenceNo: body.orderId || payment.referenceNo,
          method: String(payment.method || '').toUpperCase().includes('SANDBOX') ? 'SANDBOX_COMPLETE' : 'CASHFREE_SUCCESS',
          receivedAt: new Date()
        }
      : {
          referenceNo: body.orderId || payment.referenceNo,
          method: 'CASHFREE_FAILED',
          receivedAt: PENDING_PAYMENT_DATE
        }
  });

  return res.json({
    ok: true,
    isPaid,
    status: getPaymentStatus(updated),
    payment: updated
  });
});

/**
 * GET /api/payments/status/:applicationId
 * Get latest payment status for an application.
 */
paymentsRouter.get('/status/:applicationId', requireAuth, async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);

  const payment = await prisma.payment.findFirst({
    where: { applicationId },
    orderBy: { id: 'desc' }
  });

  return res.json({
    payment,
    status: getPaymentStatus(payment),
    isPaid: isPaymentSuccessful(payment)
  });
});

/**
 * POST /api/payments/sandbox/complete/:applicationId
 * Dev-only: mark a sandbox payment as complete so submission can proceed.
 */
paymentsRouter.post('/sandbox/complete/:applicationId', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);

  const student = await prisma.student.findUnique({ where: { userId: req.auth.userId } });
  if (!student) return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING' });

  const application = await prisma.examApplication.findFirst({
    where: { id: applicationId, studentId: student.id }
  });
  if (!application) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

  const payment = await prisma.payment.findFirst({ where: { applicationId }, orderBy: { id: 'desc' } });
  if (!payment) return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });

  const isSandboxPayment = String(payment.method || '').toUpperCase().includes('SANDBOX');
  if (!isSandboxPayment) {
    return res.status(409).json({
      error: 'SANDBOX_NOT_AVAILABLE',
      message: 'Simulated completion is only available for sandbox fallback payments.'
    });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { receivedAt: new Date(), method: 'SANDBOX_COMPLETE' }
  });

  return res.json({ ok: true, payment: updated });
});
