import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError } from '../middleware/errorHandler';
import { getPost, listPosts, searchPosts } from '../services/postStore';

export const postsRouter = Router();

postsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: await listPosts(false) });
  }),
);

postsRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    res.json({ data: await searchPosts(String(req.query.q || '')) });
  }),
);

postsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const post = await getPost(req.params.slug);
    if (!post) throw new HttpError(404, 'Post not found');
    res.json({ data: post });
  }),
);
