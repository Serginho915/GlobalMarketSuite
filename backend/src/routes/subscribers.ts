import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { addSubscriber } from '../services/subscriberStore';

export const subscribersRouter = Router();

subscribersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const subscriber = await addSubscriber(String(req.body?.email || ''));
    res.status(201).json({ data: subscriber, message: 'You are subscribed.' });
  }),
);
