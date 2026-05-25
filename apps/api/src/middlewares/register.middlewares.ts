import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import type { Env } from '@roadguard/config';
import type { ApiConfig } from '../config/index.js';
import { requestLoggerMiddleware } from '../logger/middleware/request-logger.middleware.js';
import { requestIdMiddleware } from './request-id.middleware.js';

export function registerMiddlewares(app: Application, _env: Env, apiConfig: ApiConfig): void {
  if (apiConfig.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware());
  app.use(helmet());
  app.use(
    cors({
      origin: apiConfig.corsOrigin,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}
