import type { Env } from './env.schema.js';

function decodeEncryptionKey(keyBase64: string): Buffer {
  try {
    return Buffer.from(keyBase64, 'base64');
  } catch {
    throw new Error('FIELD_ENCRYPTION_KEY must be valid base64');
  }
}

function assertProductionCors(env: Env): void {
  if (env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.trim() === '') {
    throw new Error(
      'Production CORS_ORIGIN must be an explicit origin list (comma-separated URLs). Wildcard (*) is not allowed.',
    );
  }

  const origins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  for (const origin of origins) {
    if (!/^https?:\/\/.+/.test(origin)) {
      throw new Error(`Invalid CORS_ORIGIN entry: ${origin}`);
    }
  }
}

function assertProductionEncryptionKey(env: Env): void {
  if (!env.FIELD_ENCRYPTION_KEY) {
    throw new Error(
      'Production requires FIELD_ENCRYPTION_KEY (base64-encoded 32-byte AES key) for bank detail encryption.',
    );
  }

  const key = decodeEncryptionKey(env.FIELD_ENCRYPTION_KEY);
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
}

function assertProductionRedis(env: Env): void {
  if (env.SOCKET_REDIS_ADAPTER && !env.REDIS_ENABLED) {
    throw new Error('SOCKET_REDIS_ADAPTER requires REDIS_ENABLED=true');
  }

  if (!env.REDIS_ENABLED) {
    console.warn(
      '[config] REDIS_ENABLED=false in production — Socket.IO uses in-memory adapter (single instance only).',
    );
  }
}

export function assertProductionEnv(env: Env): void {
  const defaultAccess = 'dev-access-secret-change-me';
  const defaultRefresh = 'dev-refresh-secret-change-me';

  if (env.JWT_ACCESS_SECRET === defaultAccess || env.JWT_REFRESH_SECRET === defaultRefresh) {
    throw new Error(
      'Production JWT secrets must not use default values. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.',
    );
  }

  assertProductionCors(env);
  assertProductionEncryptionKey(env);
  assertProductionRedis(env);
}
