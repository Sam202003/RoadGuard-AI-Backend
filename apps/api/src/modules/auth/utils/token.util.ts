import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Env } from '@roadguard/config';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import type { JwtPayload, TokenType } from '../interfaces/auth.interface.js';
import type { UserRole } from '@roadguard/types';

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(
  env: Env,
  payload: Omit<JwtPayload, 'type'>,
): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign({ ...payload, type: 'access' as TokenType }, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(
  env: Env,
  payload: Omit<JwtPayload, 'type'>,
): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign({ ...payload, type: 'refresh' as TokenType }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(env: Env, token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new AppError('Invalid access token', HTTP_STATUS.UNAUTHORIZED);
    }

    return decoded;
  } catch {
    throw new AppError('Invalid or expired access token', HTTP_STATUS.UNAUTHORIZED);
  }
}

export function verifyRefreshToken(env: Env, token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    return decoded;
  } catch {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
  }
}

export function createTokenPair(
  env: Env,
  user: { id: string; email: string; role: UserRole },
): { accessToken: string; refreshToken: string } {
  const base = { sub: user.id, email: user.email, role: user.role };

  return {
    accessToken: signAccessToken(env, base),
    refreshToken: signRefreshToken(env, base),
  };
}

export function generateOpaqueRefreshToken(): string {
  return randomBytes(48).toString('hex');
}
