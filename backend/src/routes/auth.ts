import { Router } from 'express';
import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError } from '../middleware/errorHandler';
import { authRateLimit } from '../services/rateLimit';
import { auditLog } from '../services/auditLog';
import { login, logout, refreshSession, validateRefreshCsrf } from '../services/auth';

export const authRouter = Router();

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api',
  });
}

authRouter.post(
  '/login',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '');
    const result = await login(email, String(req.body?.password || ''));
    if (!result) {
      await auditLog('login_failed', { email });
      throw new HttpError(401, 'Invalid email or password');
    }
    await auditLog('login_success', result.user);
    setRefreshCookie(res, result.refreshToken);
    res.json({ data: { user: result.user, accessToken: result.accessToken, csrfToken: result.csrfToken } });
  }),
);

authRouter.post(
  '/refresh',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const result = await refreshSession(req.cookies?.refresh_token, req.header('x-csrf-token'));
    if (!result) throw new HttpError(401, 'Session expired. Please sign in again.');
    res.json({ data: result });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const validCsrf = await validateRefreshCsrf(req.cookies?.refresh_token, req.header('x-csrf-token'));
    if (!validCsrf) throw new HttpError(403, 'Invalid CSRF token');
    await logout(req.cookies?.refresh_token);
    res.clearCookie('refresh_token', { path: '/api' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ data: { ok: true } });
  }),
);
