import type { Server } from 'node:http';
import { SHUTDOWN_TIMEOUT_MS } from '../constants/index.js';
import { getLogger } from '../logger/index.js';

export interface ShutdownOptions {
  server: Server;
  appName: string;
  timeoutMs?: number;
  onShutdown?: () => Promise<void>;
}

export function registerGracefulShutdown(options: ShutdownOptions): void {
  const { server, timeoutMs = SHUTDOWN_TIMEOUT_MS, onShutdown } = options;
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    const logger = getLogger();
    logger.info({ signal }, `${signal} received — shutting down gracefully`);

    const forceExitTimer = setTimeout(() => {
      logger.error(`Forced shutdown after ${timeoutMs}ms`);
      process.exit(1);
    }, timeoutMs);

    server.close(async (err) => {
      try {
        if (err) {
          logger.error({ err }, 'Error closing HTTP server');
          process.exit(1);
        }

        logger.info('HTTP server closed');

        if (onShutdown) {
          await onShutdown();
        }

        clearTimeout(forceExitTimer);
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (shutdownError) {
        clearTimeout(forceExitTimer);
        logger.error({ err: shutdownError }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
