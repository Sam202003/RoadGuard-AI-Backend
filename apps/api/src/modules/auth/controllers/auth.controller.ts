import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getAuthService } from '../index.js';
import type { LoginBody, LogoutBody, RefreshTokenBody, RegisterBody } from '../validators/auth.validator.js';

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterBody;
  const result = await getAuthService().register(body);

  sendSuccess(res, {
    message: 'Registration successful',
    data: result,
    statusCode: 201,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginBody;
  const result = await getAuthService().login(body);

  sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const body = req.body as RefreshTokenBody;
  const tokens = await getAuthService().refreshAccessToken(body.refreshToken);

  sendSuccess(res, {
    message: 'Token refreshed',
    data: { tokens },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const body = req.body as LogoutBody;
  const userId = req.user!.id;

  await getAuthService().logout(userId, body.refreshToken);

  sendSuccess(res, {
    message: 'Logged out successfully',
  });
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  await getAuthService().logoutAll(req.user!.id);

  sendSuccess(res, {
    message: 'All sessions revoked',
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await getAuthService().getMe(req.user!.id);

  sendSuccess(res, {
    message: 'Profile fetched',
    data: { user },
  });
}
