import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/index.js';
import { getLogger } from '../index.js';

/**
 * Logs errors before passing to the global error handler.
 */
export function errorLoggerMiddleware(
  err: unknown,
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const logger = getLogger().child({
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode, errors: err.errors }, err.message);
  } else if (err instanceof Error) {
    logger.error({ err }, err.message);
  } else {
    logger.error({ err }, 'Unknown error');
  }

  next(err);
}
