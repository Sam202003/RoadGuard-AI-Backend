import type { Env } from '@roadguard/config';
import { createLogger, getLogger, createChildLogger } from '@roadguard/logger';

export function initLogger(env: Env): void {
  createLogger({
    name: env.APP_NAME,
    level: env.LOG_LEVEL,
    isDevelopment: env.NODE_ENV === 'development',
  });
}

export { getLogger, createChildLogger };
