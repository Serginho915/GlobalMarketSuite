import { Router } from 'express';
import { getHealthIndex } from '../services/healthIndex';

export const healthIndexRouter = Router();

healthIndexRouter.get('/', (_req, res) => {
  res.json({ data: getHealthIndex() });
});
