import express, { type Application } from 'express';
import type { Env } from '@roadguard/config';
import { createApiConfig } from './config/index.js';
import { registerSwaggerDocs } from './docs/register-swagger.js';
import {
  attachLocalsMiddleware,
  errorHandler,
  notFoundHandler,
  registerMiddlewares,
} from './middlewares/index.js';
import { errorLoggerMiddleware } from './logger/middleware/error-logger.middleware.js';
import { registerRoutes } from './routes/index.js';

/**
 * Express application factory.
 */
export function createApp(env: Env): Application {
  const apiConfig = createApiConfig(env);
  const app = express();

  app.locals.env = env;
  app.locals.apiConfig = apiConfig;
  app.locals.startedAt = Date.now();

  app.use(attachLocalsMiddleware(app));
  registerMiddlewares(app, env, apiConfig);
  registerSwaggerDocs(app);
  registerRoutes(app, apiConfig);

  app.use(notFoundHandler);
  app.use(errorLoggerMiddleware);
  app.use(errorHandler);

  return app;
}
