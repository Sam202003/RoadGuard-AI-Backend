import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const headerId = req.headers['x-request-id'];
  req.requestId = typeof headerId === 'string' ? headerId : randomUUID();
  next();
}
