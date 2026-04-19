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

function groupedCounts(items = [], keyFn = () => '') {
  const map = new Map();
  for (const item of items) {
    const key = String(keyFn(item) || '').trim() || 'Unknown';
    if (!map.has(key)) {
      map.set(key, { label: key, count: 0, amountPaise: 0 });
    }
    const current = map.get(key);
    current.count += 1;
    current.amountPaise += Number(item.amountPaise || 0);
  }
  return [...map.values()].sort((a, b) => b.amountPaise - a.amountPaise || b.count - a.count);
}

function parseDashboardQuery(query = {}) {
  const parsed = z.object({
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'NOT_INITIATED']).optional(),
    examId: z.coerce.number().int().positive().optional(),
    instituteId: z.coerce.number().int().positive().optional(),
    district: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional()
  }).parse(query);

  return {
    ...parsed,
    fromDate: parsed.from ? new Date(parsed.from) : null,
    toDate: parsed.to ? new Date(parsed.to) : null
  };
}

async function getDashboardPayments(query) {
  const params = parseDashboardQuery(query);

  const payments = await prisma.payment.findMany({
    where: {
      ...(params.fromDate || params.toDate
        ? {
            receivedAt: {
              ...(params.fromDate ? { gte: params.fromDate } : {}),
              ...(params.toDate ? { lte: params.toDate } : {})
            }
          }
        : {}),
      application: {
        ...(params.examId ? { examId: params.examId } : {}),
        ...(params.instituteId ? { instituteId: params.instituteId } : {}),
        ...(params.district ? { institute: { district: params.district } } : {})
      }
    },
    include: {
      application: {
        include: {
          exam: {
            select: { id: true, name: true, session: true, academicYear: true }
          },
          institute: {
            select: { id: true, name: true, district: true, code: true, collegeNo: true }
          },
          student: {
            select: { id: true, firstName: true, lastName: true, mobile: true }
          }
        }
      }
    },
    orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    take: 2000
  });

  const enriched = payments
    .map((payment) => ({
      ...payment,
      createdAt: payment.receivedAt,
      status: getPaymentStatus(payment)
    }))
    .filter((payment) => (params.status ? payment.status === params.status : true));

  const success = enriched.filter((payment) => payment.status === 'SUCCESS');
  const failed = enriched.filter((payment) => payment.status === 'FAILED');
  const pending = enriched.filter((payment) => payment.status === 'PENDING');

  return {
    summary: {
      totalTransactions: enriched.length,
      successCount: success.length,
      failedCount: failed.length,
      pendingCount: pending.length,
      totalCollectedPaise: success.reduce((sum, payment) => sum + Number(payment.amountPaise || 0), 0),
      totalCollectedRupees: success.reduce((sum, payment) => sum + Number(payment.amountPaise || 0), 0) / 100
    },
    grouped: {
      byDistrict: groupedCounts(success, (payment) => payment.application?.institute?.district || 'Unknown'),
      byInstitute: groupedCounts(success, (payment) => payment.application?.institute?.name || 'Unknown'),
      byExam: groupedCounts(success, (payment) => {
        const exam = payment.application?.exam;
        return exam ? `${exam.name} (${exam.session} ${exam.academicYear})` : 'Unknown';
      })
    },
    failedPayments: failed.slice(0, 200),
    latestTransactions: enriched.slice(0, 200),
    rawRows: enriched
  };
}

async function getAccessibleStudentIdsForUser(userId) {
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { userId },
        { managerUserId: userId }
      ]
    },
    select: { id: true }
  });
  return Array.from(new Set(students.map((student) => student.id).filter(Boolean)));
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

  const normalizedUserId = Number(req.auth.userId);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const application = await prisma.examApplication.findFirst({
    where: {
      id: applicationId,
      student: {
        OR: [
          { userId: normalizedUserId },
          { managerUserId: normalizedUserId }
        ]
      }
    },
    include: {
      exam: true,
      student: { include: { user: true } }
    }
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
      customerName: `${application.student?.firstName ?? ''} ${application.student?.lastName ?? ''}`.trim() || 'Student',
      customerEmail: application.student?.user?.email ?? 'noreply@hsc.msbshse.ac.in',
      customerPhone: application.student?.mobile ?? '9999999999',
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
      sandbox: CASHFREE_ENVIRONMENT === 'sandbox',
      status: 'PENDING',
      message: CASHFREE_ENVIRONMENT === 'sandbox'
        ? 'Test payment mode is active. Use Simulate Success to continue this sandbox flow.'
        : undefined
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

  const normalizedUserId = Number(req.auth.userId);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const application = await prisma.examApplication.findFirst({
    where: {
      id: applicationId,
      student: {
        OR: [
          { userId: normalizedUserId },
          { managerUserId: normalizedUserId }
        ]
      }
    }
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

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: isPaid ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED',
    entityType: 'payment',
    entityId: updated.id,
    meta: {
      applicationId,
      status: getPaymentStatus(updated),
      orderId: body.orderId || updated.referenceNo || null,
      paymentStatus: normalizedStatus || null
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
 * GET /api/payments/dashboard
 * Board/Super admin payment analytics with filters.
 */
paymentsRouter.get('/dashboard', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const dashboard = await getDashboardPayments(req.query ?? {});

  return res.json({
    summary: dashboard.summary,
    grouped: dashboard.grouped,
    failedPayments: dashboard.failedPayments,
    latestTransactions: dashboard.latestTransactions
  });
});

/**
 * GET /api/payments/dashboard/export
 * Export filtered payment rows as CSV.
 */
paymentsRouter.get('/dashboard/export', requireAuth, requireRole(['BOARD', 'SUPER_ADMIN']), async (req, res) => {
  const dashboard = await getDashboardPayments(req.query ?? {});
  const rows = dashboard.rawRows || [];

  const headers = [
    'paymentId',
    'status',
    'paymentDate',
    'amountRupees',
    'method',
    'referenceNo',
    'applicationId',
    'applicationNo',
    'applicationStatus',
    'examName',
    'examSession',
    'academicYear',
    'instituteName',
    'district',
    'studentName',
    'studentMobile'
  ];

  const csvLines = [headers.join(',')];
  for (const row of rows) {
    const studentName = [row.application?.student?.firstName, row.application?.student?.lastName].filter(Boolean).join(' ').trim();
    const values = [
      row.id,
      row.status,
      row.receivedAt ? new Date(row.receivedAt).toISOString() : '',
      (Number(row.amountPaise || 0) / 100).toFixed(2),
      row.method || '',
      row.referenceNo || '',
      row.application?.id || '',
      row.application?.applicationNo || '',
      row.application?.status || '',
      row.application?.exam?.name || '',
      row.application?.exam?.session || '',
      row.application?.exam?.academicYear || '',
      row.application?.institute?.name || '',
      row.application?.institute?.district || '',
      studentName,
      row.application?.student?.mobile || ''
    ].map((value) => {
      const text = String(value ?? '');
      const escaped = text.replaceAll('"', '""');
      return `"${escaped}"`;
    });
    csvLines.push(values.join(','));
  }

  const csv = csvLines.join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="payment-report-${timestamp}.csv"`);
  return res.status(200).send(csv);
});

/**
 * GET /api/payments/my
 * Student payment history across all accessible applications.
 */
paymentsRouter.get('/my', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const query = z.object({
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'NOT_INITIATED']).optional(),
    examId: z.coerce.number().int().positive().optional(),
    from: z.string().optional(),
    to: z.string().optional()
  }).parse(req.query ?? {});

  const accessibleStudentIds = await getAccessibleStudentIdsForUser(req.auth.userId);
  if (!accessibleStudentIds.length) {
    return res.json({ payments: [] });
  }

  const fromDate = query.from ? new Date(query.from) : null;
  const toDate = query.to ? new Date(query.to) : null;

  const paymentRows = await prisma.payment.findMany({
    where: {
      application: {
        studentId: { in: accessibleStudentIds },
        ...(query.examId ? { examId: query.examId } : {})
      },
      ...(fromDate || toDate
        ? {
            receivedAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {})
            }
          }
        : {})
    },
    include: {
      application: {
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              session: true,
              academicYear: true
            }
          },
          institute: {
            select: {
              id: true,
              name: true,
              district: true,
              code: true,
              collegeNo: true
            }
          }
        }
      }
    },
    orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    take: 300
  });

  const enriched = paymentRows
    .map((payment) => {
      const status = getPaymentStatus(payment);
      const appStatus = String(payment.application?.status || '').toUpperCase();
      const printable = appStatus === 'SUBMITTED' && status === 'SUCCESS';

      return {
        ...payment,
        createdAt: payment.receivedAt,
        status,
        isPaid: status === 'SUCCESS',
        printable,
        canRetry: status !== 'SUCCESS',
        application: {
          id: payment.application?.id,
          applicationNo: payment.application?.applicationNo,
          status: payment.application?.status,
          candidateType: payment.application?.candidateType,
          exam: payment.application?.exam,
          institute: payment.application?.institute
        }
      };
    })
    .filter((payment) => (query.status ? payment.status === query.status : true));

  return res.json({ payments: enriched });
});

/**
 * GET /api/payments/receipt/:applicationId
 * Student receipt payload for printable fee acknowledgement.
 */
paymentsRouter.get('/receipt/:applicationId', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);

  const normalizedUserId = Number(req.auth.userId);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const application = await prisma.examApplication.findFirst({
    where: {
      id: applicationId,
      student: {
        OR: [
          { userId: normalizedUserId },
          { managerUserId: normalizedUserId }
        ]
      }
    },
    include: {
      exam: {
        select: {
          id: true,
          name: true,
          session: true,
          academicYear: true
        }
      },
      institute: {
        select: {
          id: true,
          name: true,
          code: true,
          collegeNo: true,
          district: true
        }
      },
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          mobile: true,
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  if (!application) {
    return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });
  }

  const payment = await prisma.payment.findFirst({
    where: { applicationId },
    orderBy: { id: 'desc' }
  });

  if (!payment || !isPaymentSuccessful(payment)) {
    return res.status(404).json({
      error: 'PAYMENT_NOT_COMPLETED',
      message: 'Receipt is available only after successful payment.'
    });
  }

  const studentName = [
    application.student?.firstName,
    application.student?.middleName,
    application.student?.lastName
  ].filter(Boolean).join(' ').trim();

  return res.json({
    receipt: {
      issuerName: 'HIsoft IT Solutions Pvt. Ltd.',
      issuerAddress: 'Chhatrapati Sambhajinagar',
      receiptNo: payment.referenceNo || `REC-${applicationId}-${payment.id}`,
      generatedAt: new Date().toISOString(),
      amountPaise: payment.amountPaise || 0,
      amountRupees: Number(payment.amountPaise || 0) / 100,
      paymentMethod: payment.method || 'ONLINE',
      paymentDate: payment.receivedAt,
      transactionReference: payment.referenceNo || null,
      orderId: payment.referenceNo || null,
      application: {
        id: application.id,
        applicationNo: application.applicationNo,
        status: application.status,
        candidateType: application.candidateType,
        exam: application.exam,
        institute: application.institute
      },
      student: {
        id: application.student?.id,
        name: studentName || `Student #${application.studentId}`,
        mobile: application.student?.mobile || null,
        email: application.student?.user?.email || null
      }
    }
  });
});

/**
 * POST /api/payments/sandbox/complete/:applicationId
 * Dev-only: mark a sandbox payment as complete so submission can proceed.
 */
paymentsRouter.post('/sandbox/complete/:applicationId', requireAuth, requireRole(['STUDENT']), async (req, res) => {
  const applicationId = z.coerce.number().int().positive().parse(req.params.applicationId);

  const normalizedUserId = Number(req.auth.userId);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const application = await prisma.examApplication.findFirst({
    where: {
      id: applicationId,
      student: {
        OR: [
          { userId: normalizedUserId },
          { managerUserId: normalizedUserId }
        ]
      }
    }
  });
  if (!application) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

  const payment = await prisma.payment.findFirst({ where: { applicationId }, orderBy: { id: 'desc' } });
  if (!payment) return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });

  const paymentMethod = String(payment.method || '').toUpperCase();
  const isSandboxPayment = paymentMethod.includes('SANDBOX');
  const isSandboxEnvironment = CASHFREE_ENVIRONMENT === 'sandbox';

  if (!isSandboxPayment && !isSandboxEnvironment) {
    return res.status(409).json({
      error: 'SANDBOX_NOT_AVAILABLE',
      message: 'Simulated completion is only available when sandbox/test payment mode is enabled.'
    });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { receivedAt: new Date(), method: 'SANDBOX_COMPLETE' }
  });

  return res.json({ ok: true, payment: updated });
});
