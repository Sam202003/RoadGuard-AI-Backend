import http from 'node:http';
import type { Application } from 'express';
import type { Env } from '@roadguard/config';
import { getLogger } from '../logger/index.js';
import { registerGracefulShutdown, type ShutdownOptions } from './lifecycle.js';

export function createHttpServer(
  app: Application,
  env: Env,
  options?: Pick<ShutdownOptions, 'onShutdown'>,
): http.Server {
  const server = http.createServer(app);

  registerGracefulShutdown({
    server,
    appName: env.APP_NAME,
    onShutdown: options?.onShutdown,
  });

  return server;
}

export function startListening(server: http.Server, port: number, appName: string): Promise<void> {
  const logger = getLogger();

  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      logger.info({ port }, `${appName} listening on port ${port}`);
      resolve();
    });

    server.on('error', reject);
  });
}
