import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { adminAuth } from '../middleware/adminAuth';
import { auditLog } from '../services/auditLog';
import { getAdminSettings, updateAdminSettings } from '../services/adminSettings';
import { deleteCoverImage, listCoverImages, saveCoverImage } from '../services/mediaStore';
import { deletePost, getPost, listPosts, upsertPost } from '../services/postStore';
import { HttpError } from '../middleware/errorHandler';
import { validateRefreshCsrf } from '../services/auth';

export const adminRouter = Router();
adminRouter.use(adminAuth);

async function requireCsrf(req: any) {
  const ok = await validateRefreshCsrf(req.cookies?.refresh_token, req.header('x-csrf-token'));
  if (!ok) throw new HttpError(403, 'Invalid CSRF token');
}

adminRouter.get(
  '/posts',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listPosts(true) });
  }),
);

adminRouter.post(
  '/posts',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    const post = await upsertPost(req.body, 'admin');
    await auditLog('post_create', req.user, { slug: post.slug });
    res.status(201).json({ data: post });
  }),
);

adminRouter.put(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    const existing = await getPost(req.params.slug, true);
    if (!existing) throw new HttpError(404, 'Post not found');
    const post = await upsertPost(req.body, 'admin', req.params.slug);
    await auditLog('post_update', req.user, { slug: post.slug });
    res.json({ data: post });
  }),
);

adminRouter.delete(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    await deletePost(req.params.slug);
    await auditLog('post_delete', req.user, { slug: req.params.slug });
    res.json({ data: { ok: true } });
  }),
);

adminRouter.get(
  '/media/covers',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listCoverImages() });
  }),
);

adminRouter.post(
  '/media/covers',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    const asset = await saveCoverImage(req.body);
    await auditLog('media_create', req.user, { name: asset.name });
    res.status(201).json({ data: asset });
  }),
);

adminRouter.delete(
  '/media/covers/:name',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    await deleteCoverImage(req.params.name);
    await auditLog('media_delete', req.user, { name: req.params.name });
    res.json({ data: { ok: true } });
  }),
);

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getAdminSettings() });
  }),
);

adminRouter.put(
  '/settings',
  asyncHandler(async (req, res) => {
    await requireCsrf(req);
    const settings = await updateAdminSettings(req.body);
    await auditLog('settings_update', req.user);
    res.json({ data: settings });
  }),
);
