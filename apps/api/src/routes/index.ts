import { Router, type Application } from 'express';
import type { ApiConfig } from '../config/index.js';
import { v1Router } from './v1/index.js';

export function registerRoutes(app: Application, apiConfig: ApiConfig): void {
  const apiRouter = Router();

  apiRouter.use(`/${apiConfig.version}`, v1Router);

  app.use(apiConfig.prefix, apiRouter);
}
