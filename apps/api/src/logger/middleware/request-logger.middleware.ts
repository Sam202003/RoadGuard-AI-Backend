import type { RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import { getLogger } from '../index.js';

export function requestLoggerMiddleware(): RequestHandler {
  return pinoHttp({
    logger: getLogger(),
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    genReqId: (req) => req.requestId ?? req.headers['x-request-id']?.toString() ?? 'unknown',
    customProps: (req) => ({
      requestId: req.requestId,
    }),
  });
}
