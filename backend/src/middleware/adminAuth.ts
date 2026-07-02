import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';
import { verifyAccessToken } from '../services/auth';
import type { AuthedRequestUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
    }
  }
}

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Admin session required');
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.');
  }
}
