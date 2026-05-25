import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/index.js';
import { formatZodErrors } from '../helpers/validation.helper.js';
import { HTTP_STATUS } from '../constants/index.js';
import { getLogger } from '../logger/index.js';
import { sendError } from '../utils/response.util.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isProduction = res.locals.apiConfig?.isProduction ?? false;

  if (err instanceof AppError) {
    sendError(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
      stack: isProduction ? undefined : err.stack,
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, {
      message: 'Validation failed',
      statusCode: HTTP_STATUS.UNPROCESSABLE,
      errors: formatZodErrors(err),
      stack: isProduction ? undefined : err.stack,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const stack = err instanceof Error ? err.stack : undefined;

  getLogger().error({ err }, 'Unhandled error');

  sendError(res, {
    message: isProduction ? 'Internal server error' : message,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    stack: isProduction ? undefined : stack,
  });
}
