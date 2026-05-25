import type { Application, NextFunction, Request, Response } from 'express';

/** Copies app.locals onto res.locals for every request (Express does not do this automatically). */
export function attachLocalsMiddleware(app: Application) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.locals.env = app.locals.env;
    res.locals.apiConfig = app.locals.apiConfig;
    res.locals.startedAt = app.locals.startedAt;
    next();
  };
}
