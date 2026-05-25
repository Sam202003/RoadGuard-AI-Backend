import type { Env } from '@roadguard/config';

export interface ApiConfig {
  prefix: string;
  version: string;
  basePath: string;
  corsOrigin: string | string[];
  trustProxy: boolean;
  isProduction: boolean;
}

export function createApiConfig(env: Env): ApiConfig {
  const prefix = env.API_PREFIX.replace(/\/$/, '');
  const version = env.API_VERSION.replace(/^\//, '');
  const basePath = `${prefix}/${version}`;

  const corsOrigin =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((o) => o.trim());

  return {
    prefix,
    version,
    basePath,
    corsOrigin,
    trustProxy: env.TRUST_PROXY ?? false,
    isProduction: env.NODE_ENV === 'production',
  };
}
