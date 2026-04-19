import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;

const results = [];
const createdUsers = [];
let createdApplicationId = null;

function pushResult(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` -> ${detail}` : ''}`);
}

function assert(condition, name, detailIfFail = 'Assertion failed') {
  if (!condition) {
    pushResult(name, false, detailIfFail);
    throw new Error(`${name}: ${detailIfFail}`);
  }
  pushResult(name, true);
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const maxAttempts = 3;
  const retryDelayMs = 700;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 429 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      continue;
    }

    return { status: res.status, data };
  }

  return { status: 429, data: { error: 'RATE_LIMIT_RETRY_EXHAUSTED' } };
}

async function ensureTempUser({ roleName, username, password, instituteId = null, email }) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Missing role: ${roleName}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      roleId: role.id,
      instituteId,
      status: 'ACTIVE',
      email,
      passwordHash
    },
    create: {
      username,
      roleId: role.id,
      instituteId,
      status: 'ACTIVE',
      email,
      passwordHash
    }
  });

  createdUsers.push(user.username);
  return user;
}

async function login(username, password) {
  const r = await apiRequest('/auth/login', {
    method: 'POST',
    body: { username, password }
  });
  return r;
}

async function getStudentToken() {
  const r = await apiRequest('/auth/google', {
    method: 'POST',
    body: { credential: 'mock_google_token_for_testing_local-student' }
  });
  return r;
}

async function cleanupCreatedApplication() {
  if (!createdApplicationId) return;
  await prisma.$transaction(async (tx) => {
    await tx.statusHistory.deleteMany({ where: { applicationId: createdApplicationId } });
    await tx.examApplicationSubject.deleteMany({ where: { applicationId: createdApplicationId } });
    await tx.exemptedSubjectInfo.deleteMany({ where: { applicationId: createdApplicationId } });
    await tx.payment.deleteMany({ where: { applicationId: createdApplicationId } });
    await tx.examApplication.deleteMany({ where: { id: createdApplicationId } });
  });
}

async function cleanupTempUsers() {
  if (!createdUsers.length) return;
  const users = await prisma.user.findMany({
    where: { username: { in: createdUsers } },
    select: { id: true }
  });

  const userIds = users.map((user) => user.id);
  if (!userIds.length) return;

  await prisma.statusHistory.deleteMany({ where: { actorUserId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function runRoleSmoke(tokens, examId) {
  const tests = [
    { name: 'Public health', path: '/health', expect: [200] },
    { name: 'Public news', path: '/public/news', expect: [200, 204] },
    { name: 'Student /me', path: '/me', token: tokens.student, expect: [200] },
    { name: 'Student applications list', path: '/applications/my', token: tokens.student, expect: [200] },
    { name: 'Student payments list', path: '/payments/my', token: tokens.student, expect: [200] },
    { name: 'Institute /me', path: '/institutes/me', token: tokens.institute, expect: [200] },
    { name: 'Institute applications list', path: '/applications/institute/list', token: tokens.institute, expect: [200] },
    { name: 'Board exams', path: '/applications/board/exams', token: tokens.board, expect: [200] },
    { name: 'Board applications list', path: `/applications/board/list?examId=${encodeURIComponent(examId)}`, token: tokens.board, expect: [200] },
    { name: 'Super institutes', path: '/institutes/all', token: tokens.super, expect: [200] },
    { name: 'Super users', path: '/users', token: tokens.super, expect: [200] }
  ];

  for (const t of tests) {
    const r = await apiRequest(t.path, { token: t.token });
    const ok = t.expect.includes(r.status);
    pushResult(t.name, ok, `status=${r.status}`);
    if (!ok) throw new Error(`${t.name} failed`);
  }
}

async function runStudentJourney(studentToken) {
  const examsRes = await apiRequest('/exams', { token: studentToken });
  assert(examsRes.status === 200, 'Student gets exams', `status=${examsRes.status}`);
  const exams = examsRes.data?.exams || [];
  assert(Array.isArray(exams) && exams.length > 0, 'At least one exam available to student');

  const exam = exams[0];
  const createRes = await apiRequest('/applications', {
    method: 'POST',
    token: studentToken,
    body: {
      examId: exam.id,
      candidateType: 'BACKLOG'
    }
  });
  assert(createRes.status === 200, 'Create application', `status=${createRes.status}`);

  const app = createRes.data?.application;
  assert(!!app?.id, 'Created application has id');
  createdApplicationId = app.id;
  const applicationNo = app.applicationNo;

  const appRow = await prisma.examApplication.findUnique({
    where: { id: app.id },
    include: { exam: true, student: true }
  });
  assert(!!appRow, 'Created application exists in DB');

  let subjectId = null;
  if (appRow?.student?.instituteId && appRow?.exam?.streamId) {
    const mapped = await prisma.instituteStreamSubject.findFirst({
      where: {
        instituteId: appRow.student.instituteId,
        streamId: appRow.exam.streamId
      },
      select: { subjectId: true }
    });
    subjectId = mapped?.subjectId ?? null;
  }

  if (!subjectId && appRow?.exam?.streamId) {
    const mapped = await prisma.streamSubject.findFirst({
      where: { streamId: appRow.exam.streamId },
      select: { subjectId: true }
    });
    subjectId = mapped?.subjectId ?? null;
  }

  if (!subjectId) {
    const anySubject = await prisma.subject.findFirst({ select: { id: true } });
    subjectId = anySubject?.id ?? null;
  }

  assert(!!subjectId, 'Subject resolved for edit step');

  const editRes = await apiRequest(`/applications/${app.id}`, {
    method: 'PUT',
    token: studentToken,
    body: {
      subjects: [
        {
          subjectId,
          langOfAnsCode: 'EN',
          isExemptedClaim: false
        }
      ]
    }
  });
  assert(editRes.status === 200, 'Edit application with subjects', `status=${editRes.status}`);

  const initiateRes = await apiRequest(`/payments/initiate/${app.id}`, {
    method: 'POST',
    token: studentToken
  });
  assert(initiateRes.status === 200, 'Initiate payment', `status=${initiateRes.status}`);

  if (!initiateRes.data?.alreadyPaid) {
    const completeRes = await apiRequest(`/payments/sandbox/complete/${app.id}`, {
      method: 'POST',
      token: studentToken
    });
    assert(completeRes.status === 200, 'Complete sandbox payment', `status=${completeRes.status}`);
  } else {
    pushResult('Complete sandbox payment', true, 'already paid');
  }

  const submitRes = await apiRequest(`/applications/${app.id}/submit`, {
    method: 'POST',
    token: studentToken
  });
  assert(submitRes.status === 200, 'Submit application', `status=${submitRes.status}`);

  const receiptRes = await apiRequest(`/payments/receipt/${app.id}`, { token: studentToken });
  assert(receiptRes.status === 200, 'Receipt endpoint returns receipt', `status=${receiptRes.status}`);
  assert(!!receiptRes.data?.receipt?.receiptNo, 'Receipt has receipt number');

  const myAppsRes = await apiRequest('/applications/my', { token: studentToken });
  assert(myAppsRes.status === 200, 'Fetch applications after submit', `status=${myAppsRes.status}`);
  const saved = (myAppsRes.data?.applications || []).find((row) => row.id === app.id);
  assert(!!saved, 'Created app appears in student list');
  assert(saved.status === 'SUBMITTED', 'Created app status is SUBMITTED', `actual=${saved.status}`);
  assert(!!saved.printable, 'Created app marked printable after payment');

  const verifyRes = await apiRequest(`/public/verify-document/${encodeURIComponent(applicationNo)}`);
  assert(verifyRes.status === 200, 'Public verify endpoint reachable', `status=${verifyRes.status}`);
  assert(verifyRes.data?.valid === true, 'Public verify endpoint marks document valid');

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify/document/${encodeURIComponent(applicationNo)}`;
  pushResult('Verification URL format generated', true, verifyUrl);

  return { examId: exam.id };
}

function printMatrix() {
  console.log('\n=== E2E PASS/FAIL MATRIX ===');
  const maxLen = Math.max(...results.map((r) => r.name.length), 10);
  for (const row of results) {
    const status = row.ok ? 'PASS' : 'FAIL';
    const name = row.name.padEnd(maxLen, ' ');
    console.log(`${status} | ${name} | ${row.detail || ''}`);
  }
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\nTOTAL: ${results.length} | PASS: ${pass} | FAIL: ${fail}`);
  return { pass, fail };
}

async function main() {
  const ts = Date.now();
  const tempSuperUsername = `super_e2e_tmp_${ts}`;
  const tempInstituteUsername = `inst_e2e_tmp_${ts}`;

  let exitCode = 0;

  try {
    const approvedInstitute = await prisma.institute.findFirst({
      where: { status: 'APPROVED' },
      orderBy: { id: 'asc' }
    });
    assert(!!approvedInstitute, 'Approved institute exists for institute role');

    await ensureTempUser({
      roleName: 'SUPER_ADMIN',
      username: tempSuperUsername,
      password: 'TmpSuper@123',
      email: `${tempSuperUsername}@example.org`
    });

    await ensureTempUser({
      roleName: 'INSTITUTE',
      username: tempInstituteUsername,
      password: 'TmpInst@123',
      instituteId: approvedInstitute.id,
      email: `${tempInstituteUsername}@example.org`
    });

    const studentLogin = await getStudentToken();
    assert(studentLogin.status === 200, 'Student login works', `status=${studentLogin.status}`);

    const boardLogin = await login('board_demo', 'Board@12345');
    assert(boardLogin.status === 200, 'Board login works', `status=${boardLogin.status}`);

    const superLogin = await login(tempSuperUsername, 'TmpSuper@123');
    assert(superLogin.status === 200, 'Super login works', `status=${superLogin.status}`);

    const instituteLogin = await login(tempInstituteUsername, 'TmpInst@123');
    assert(instituteLogin.status === 200, 'Institute login works', `status=${instituteLogin.status}`);

    const tokens = {
      student: studentLogin.data.accessToken,
      board: boardLogin.data.accessToken,
      super: superLogin.data.accessToken,
      institute: instituteLogin.data.accessToken
    };

    const journey = await runStudentJourney(tokens.student);
    await runRoleSmoke(tokens, journey.examId);
  } catch (err) {
    exitCode = 1;
    console.error('\nE2E execution failed:', err.message);
  } finally {
    try {
      await cleanupCreatedApplication();
      pushResult('Cleanup created application', true);
    } catch (e) {
      pushResult('Cleanup created application', false, e.message);
      exitCode = 1;
    }

    try {
      await cleanupTempUsers();
      pushResult('Cleanup temporary users', true);
    } catch (e) {
      pushResult('Cleanup temporary users', false, e.message);
      exitCode = 1;
    }

    const summary = printMatrix();
    await prisma.$disconnect();
    if (summary.fail > 0) exitCode = 1;
    process.exit(exitCode);
  }
}

main();
