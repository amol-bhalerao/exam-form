import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { signAccessToken, signRefreshToken, hashToken, compareToken, verifyRefreshToken } from '../auth/tokens.js';
import { requireAuth } from '../auth/middleware.js';
import { env } from '../env.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
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
  if (user.role.name === 'INSTITUTE' && user.institute?.status !== 'APPROVED') return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const authUser = {
    userId: user.id,
    role: user.role.name as any,
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
});

authRouter.post('/refresh', async (req, res) => {
  const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);

  let decoded: any;
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

  const authUser = {
    userId: user.id,
    role: user.role.name as any,
    instituteId: user.instituteId ?? null,
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

authRouter.put('/me', requireAuth, async (req, res) => {
  const body = z.object({ email: z.string().email().optional(), mobile: z.string().min(8).optional() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { email: body.email ?? user.email, mobile: body.mobile ?? user.mobile } });
  return res.json({ user: { userId: updated.id, username: updated.username, role: (await prisma.role.findUnique({ where: { id: updated.roleId } }))?.name ?? 'UNKNOWN', instituteId: updated.instituteId } });
});

authRouter.put('/me/password', requireAuth, async (req, res) => {
  const body = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  const match = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!match) return res.status(403).json({ error: 'INVALID_PASSWORD' });
  const passwordHash = await bcrypt.hash(body.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return res.json({ ok: true });
});

authRouter.post('/register', async (req, res) => {
  const body = z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8)
    })
    .parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: body.email }, { email: body.email }] }
  });

  if (existingUser) {
    return res.status(409).json({ error: 'USER_ALREADY_EXISTS' });
  }

  // Get STUDENT role
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  if (!studentRole) {
    return res.status(500).json({ error: 'ROLE_NOT_FOUND' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(body.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      username: body.email,
      email: body.email,
      passwordHash,
      roleId: studentRole.id,
      status: 'ACTIVE',
      firstName: body.firstName,
      lastName: body.lastName
    }
  });

  return res.status(201).json({
    message: 'Account created successfully',
    userId: user.id
  });
});

