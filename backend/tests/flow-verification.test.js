import { beforeAll, describe, expect, it } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_CREDENTIAL = 'mock_google_token_for_testing_local-student';

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }
  }

  return {
    status: response.status,
    data,
    headers: Object.fromEntries(response.headers.entries())
  };
}

describe('Automated Flow Verification', () => {
  let token = '';
  let templateSubmittedAppId = null;
  let templateStudentId = null;
  let templateExamId = null;
  let templateSubjects = [];
  let unpaidDraftAppId = null;

  beforeAll(async () => {
    const login = await api('POST', '/api/auth/google', {
      body: { credential: TEST_CREDENTIAL }
    });

    expect(login.status).toBe(200);
    expect(login.data.accessToken).toBeTruthy();
    token = login.data.accessToken;

    const appsRes = await api('GET', '/api/applications/my', { token });
    expect(appsRes.status).toBe(200);
    expect(Array.isArray(appsRes.data.applications)).toBe(true);

    const submittedApp = appsRes.data.applications.find(
      (app) => String(app.status).toUpperCase() === 'SUBMITTED' && app.paymentCompleted === true
    );

    expect(submittedApp, 'Need at least one paid submitted application for verification').toBeTruthy();

    templateSubmittedAppId = submittedApp.id;
    templateStudentId = submittedApp.studentId;
    templateExamId = submittedApp.examId;

    const fullTemplateRes = await api('GET', `/api/applications/${templateSubmittedAppId}`, { token });
    expect(fullTemplateRes.status).toBe(200);
    const fullTemplate = fullTemplateRes.data.application;

    templateSubjects = (fullTemplate.subjects || [])
      .map((entry) => ({
        subjectId: entry.subjectId,
        langOfAnsCode: entry.langOfAnsCode || 'ENGLISH',
        isExemptedClaim: !!entry.isExemptedClaim
      }));

    expect(templateSubjects.length, 'Need at least one subject in submitted template application').toBeGreaterThan(0);

    const createRes = await api('POST', '/api/applications', {
      token,
      body: {
        examId: templateExamId,
        studentId: templateStudentId,
        candidateType: 'BACKLOG'
      }
    });

    expect(createRes.status).toBe(200);
    expect(createRes.data.application?.id).toBeTruthy();
    unpaidDraftAppId = createRes.data.application.id;

    const updateRes = await api('PUT', `/api/applications/${unpaidDraftAppId}`, {
      token,
      body: { subjects: templateSubjects }
    });

    expect(updateRes.status).toBe(200);
  });

  it('submit gate behavior: blocks final submission when payment is not completed', async () => {
    const submitRes = await api('POST', `/api/applications/${unpaidDraftAppId}/submit`, {
      token,
      body: {}
    });

    expect(submitRes.status).toBe(402);
    expect(submitRes.data.error).toBe('PAYMENT_REQUIRED');
  });

  it('receipt endpoint behavior: returns receipt for paid app and error for unpaid app', async () => {
    const paidReceiptRes = await api('GET', `/api/payments/receipt/${templateSubmittedAppId}`, { token });
    expect(paidReceiptRes.status).toBe(200);
    expect(paidReceiptRes.data.receipt).toBeTruthy();
    expect(paidReceiptRes.data.receipt.application?.id).toBe(templateSubmittedAppId);

    const unpaidReceiptRes = await api('GET', `/api/payments/receipt/${unpaidDraftAppId}`, { token });
    expect(unpaidReceiptRes.status).toBe(404);
    expect(unpaidReceiptRes.data.error).toBe('PAYMENT_NOT_COMPLETED');
  });

  it('printable flags in applications list: are present and match status/payment conditions', async () => {
    const appsRes = await api('GET', '/api/applications/my', { token });
    expect(appsRes.status).toBe(200);

    const apps = appsRes.data.applications || [];
    expect(apps.length).toBeGreaterThan(0);

    for (const app of apps) {
      expect(typeof app.paymentCompleted).toBe('boolean');
      expect(typeof app.printable).toBe('boolean');

      const expectedPrintable = String(app.status).toUpperCase() !== 'DRAFT' && app.paymentCompleted === true;
      expect(app.printable).toBe(expectedPrintable);
    }

    const createdDraft = apps.find((app) => app.id === unpaidDraftAppId);
    expect(createdDraft).toBeTruthy();
    expect(createdDraft.status).toBe('DRAFT');
    expect(createdDraft.printable).toBe(false);
  });

  it('payments list endpoint responds successfully for authenticated student', async () => {
    const paymentsRes = await api('GET', '/api/payments/my', { token });
    expect(paymentsRes.status).toBe(200);
    expect(Array.isArray(paymentsRes.data.payments)).toBe(true);
  });
});
