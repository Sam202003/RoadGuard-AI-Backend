import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '@roadguard/types';

export function sendSuccess<T>(
  res: Response,
  options: {
    message?: string;
    data?: T;
    meta?: Record<string, unknown>;
    statusCode?: number;
  } = {},
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    message: options.message ?? 'OK',
    ...(options.data !== undefined && { data: options.data }),
    ...(options.meta !== undefined && { meta: options.meta }),
  };

  return res.status(options.statusCode ?? 200).json(body);
}

export function sendError(
  res: Response,
  options: {
    message: string;
    statusCode?: number;
    errors?: unknown[];
    stack?: string;
  },
): Response {
  const body: ApiErrorResponse = {
    success: false,
    message: options.message,
    ...(options.errors !== undefined && options.errors.length > 0 && { errors: options.errors }),
    ...(options.stack !== undefined && { stack: options.stack }),
  };

  return res.status(options.statusCode ?? 500).json(body);
}
