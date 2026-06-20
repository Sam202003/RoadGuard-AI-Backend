import type { NextFunction, Request, Response } from 'express';
import type { Env } from '@roadguard/config';
import { AppError } from '../errors/index.js';
import { verifyAccessToken } from '../modules/auth/utils/token.util.js';
import type { AuthenticatedUser } from '../modules/auth/interfaces/auth.interface.js';
import { resolveActiveUser } from './user-status-cache.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token required');
    }

    const token = header.slice(7).trim();

    if (!token) {
      throw AppError.unauthorized('Access token required');
    }

    const env = req.res?.locals?.env as Env | undefined;

    if (!env) {
      throw new Error('Environment not available on request');
    }

    const payload = verifyAccessToken(env, token);

    const resolved = await resolveActiveUser(payload.sub, payload.email, payload.role);

    if (!resolved.isActive) {
      throw AppError.unauthorized('Account is deactivated');
    }

    const user: AuthenticatedUser = {
      id: resolved.id,
      email: resolved.email,
      role: resolved.role,
    };

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
