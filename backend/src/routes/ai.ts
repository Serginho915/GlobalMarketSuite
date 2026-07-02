import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { adminAuth } from '../middleware/adminAuth';
import { generateAndStoreArticles } from '../services/generationScheduler';
import { validateRefreshCsrf } from '../services/auth';
import { HttpError } from '../middleware/errorHandler';

export const aiRouter = Router();

aiRouter.post(
  '/generate-article',
  adminAuth,
  asyncHandler(async (req, res) => {
    const ok = await validateRefreshCsrf(req.cookies?.refresh_token, req.header('x-csrf-token'));
    if (!ok) throw new HttpError(403, 'Invalid CSRF token');
    const count = Number(req.body?.count || 3);
    const posts = await generateAndStoreArticles(req.user, count);
    res.status(201).json({ data: posts });
  }),
);
