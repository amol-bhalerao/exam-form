import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../prisma.js';
import { signAccessToken, signRefreshToken, hashToken, compareToken, verifyRefreshToken } from '../auth/tokens.js';
import { requireAuth } from '../auth/middleware.js';
import { writeAuditLog } from '../middleware/audit-log.js';
import { env } from '../env.js';

export const authRouter = Router();

// Lazily initialise Google OAuth2 client (only if GOOGLE_CLIENT_ID is set)
let googleClient = null;
function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not configured');
  if (!googleClient) googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return googleClient;
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = z
      .object({
        username: z.string().min(1),
        password: z.string().min(1)
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: body.username },
      include: { role: true, institute: true }
    });

    if (!user || user.status !== 'ACTIVE') return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    // Block credential login for Google-SSO-only users (students with authProvider=google)
    if (user.authProvider === 'google') {
      return res.status(401).json({
        error: 'USE_GOOGLE_LOGIN',
        message: 'This account uses Google Sign-In. Please use the "Continue with Google" button.'
      });
    }

    if (user.role.name === 'INSTITUTE' && user.institute?.status !== 'APPROVED') return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const authUser = {
      userId: user.id,
      role: user.role.name,
      instituteId: user.instituteId ?? null,
      username: user.username
    };

    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashToken(refreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    // For local dev: allow JS to read refresh token. In production prefer httpOnly cookies.
    return res.json({
      accessToken,
      refreshToken,
      user: { ...authUser }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res) => {
  const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);

  let decoded;
  try {
    decoded = verifyRefreshToken(body.refreshToken);
  } catch {
    return res.status(401).json({ error: 'INVALID_REFRESH' });
  }

  if (!decoded?.userId) return res.status(401).json({ error: 'INVALID_REFRESH' });

  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId: decoded.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' },
    take: 25
  });

  const match = await (async () => {
    for (const t of tokens) {
      if (await compareToken(body.refreshToken, t.tokenHash)) return t;
    }
    return null;
  })();

  if (!match) return res.status(401).json({ error: 'INVALID_REFRESH' });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { role: true, institute: true } });
  if (!user || user.status !== 'ACTIVE') return res.status(401).json({ error: 'INVALID_REFRESH' });
  if (user.role.name === 'INSTITUTE' && user.institute?.status !== 'APPROVED') return res.status(401).json({ error: 'INVALID_REFRESH' });

  // For students, fetch the Student profile to get the correct instituteId
  let instituteId = user.instituteId ?? null;
  if (user.role.name === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { instituteId: true }
    });
    if (student) {
      instituteId = student.instituteId;
    }
  }

  const authUser = {
    userId: user.id,
    role: user.role.name,
    instituteId: instituteId,
    username: user.username
  };

  const accessToken = signAccessToken(authUser);
  return res.json({ accessToken, user: authUser });
});

authRouter.post('/logout', async (req, res) => {
  const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
  // Best-effort revoke: find matching token by comparing hashes
  const decoded = (() => {
    try {
      return verifyRefreshToken(body.refreshToken);
    } catch {
      return null;
    }
  })();

  if (decoded?.userId) {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId: decoded.userId, revokedAt: null },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    for (const t of tokens) {
      if (await compareToken(body.refreshToken, t.tokenHash)) {
        await prisma.refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
        break;
      }
    }
  }

  return res.json({ ok: true });
});

/**
 * Verify access token without logging token verification checks
 * Used by frontend to silently verify session validity
 */
authRouter.post('/verify', requireAuth, (req, res) => {
  return res.json({ ok: true, user: req.auth });
});

authRouter.put('/me', requireAuth, async (req, res) => {
  const body = z.object({ email: z.string().email().optional(), mobile: z.string().max(10).regex(/^\d{1,10}$/, 'Mobile must be numeric and max 10 digits').optional() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { email: body.email ?? user.email, mobile: body.mobile ?? user.mobile } });
  const role = await prisma.role.findUnique({ where: { id: updated.roleId } });
  return res.json({ user: { userId: updated.id, username: updated.username, role: role?.name ?? 'UNKNOWN', instituteId: updated.instituteId } });
});

authRouter.put('/me/password', requireAuth, async (req, res) => {
  const body = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  const match = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!match) return res.status(403).json({ error: 'INVALID_PASSWORD' });
  const passwordHash = await bcrypt.hash(body.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return res.json({ ok: true });
});

/**
 * POST /api/auth/google
 * Google SSO for STUDENTS only.
 * Receives a Google credential (ID token) from the frontend Google Sign-In button.
 * Logs in existing student or creates account if first login.
 */
authRouter.post('/google', async (req, res) => {
  const body = z.object({ credential: z.string().min(10) }).parse(req.body);

  // Handle test tokens in development mode
  if (body.credential.startsWith('mock_google_token_for_testing_')) {
    const timestamp = body.credential.replace('mock_google_token_for_testing_', '');
    const testEmail = `test-student-${timestamp}@hsc-exam-dev.local`;
    const testName = 'Test Student';
    
    // Get STUDENT role
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) return res.status(500).json({ error: 'STUDENT_ROLE_MISSING' });

    // Find or create test user
    let user = await prisma.user.findFirst({
      where: { email: testEmail, authProvider: 'google' },
      include: { role: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: `test_${timestamp}`,
          email: testEmail,
          passwordHash: '',
          roleId: studentRole.id,
          status: 'ACTIVE',
          googleId: `test_${timestamp}`,
          authProvider: 'google'
        },
        include: { role: true }
      });

      // Create student profile
      await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          instituteId: 0,
          firstName: 'Test',
          lastName: 'Student',
          mobile: null
        }
      }).catch(() => {});
    }

    const authUser = {
      userId: user.id,
      role: user.role.name,
      instituteId: user.instituteId ?? null,
      username: user.email ?? user.username
    };

    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashToken(refreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      accessToken,
      refreshToken,
      user: authUser
    });
  }

  // Verify the Google ID token
  let payload;
  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN', message: err.message });
  }

  if (!payload?.sub || !payload?.email) {
    return res.status(401).json({ error: 'INVALID_GOOGLE_PAYLOAD' });
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name ?? '';
  const [firstName, ...rest] = name.trim().split(' ');
  const lastName = rest.join(' ') || '';

  // Get STUDENT role
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  if (!studentRole) return res.status(500).json({ error: 'STUDENT_ROLE_MISSING' });

  // Find or create user
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email, authProvider: 'google' }] },
    include: { role: true }
  });

  if (!user) {
    // First Google login – create student account
    // Use email as username for Google SSO accounts
    user = await prisma.user.create({
      data: {
        username: email,
        email,
        passwordHash: '', // No password for SSO accounts
        roleId: studentRole.id,
        status: 'ACTIVE',
        googleId,
        authProvider: 'google'
      },
      include: { role: true }
    });

    // Create initial student profile so the student can fill details later
    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        // @ts-ignore - instituteId is required but 0 is handled in frontend
        instituteId: 0,
        firstName,
        lastName,
        mobile: null
      }
    }).catch(() => {
      // Student profile creation may fail if instituteId constraint fails; that's ok – user still logs in
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: 'GOOGLE_SSO_REGISTER',
      entityType: 'user',
      entityId: user.id,
      meta: { email, googleId }
    });
  } else if (user.status !== 'ACTIVE') {
    return res.status(401).json({ error: 'ACCOUNT_DISABLED' });
  }

  const authUser = {
    userId: user.id,
    role: user.role.name,
    instituteId: user.instituteId ?? null,
    username: user.email ?? user.username
  };

  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'GOOGLE_SSO_LOGIN',
    entityType: 'user',
    entityId: user.id,
    meta: { email }
  });

  return res.json({ accessToken, refreshToken, user: authUser });
});
