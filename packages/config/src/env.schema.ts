import { z } from 'zod';

/**
 * Central environment schema — validated once at startup.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().default('roadguard-api'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_PREFIX: z.string().default('/api'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),

  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/roadguard'),
  MONGODB_DB_NAME: z.string().default('roadguard'),
  MONGODB_MAX_RETRIES: z.coerce.number().int().positive().default(5),
  MONGODB_RETRY_DELAY_MS: z.coerce.number().int().positive().default(3000),

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  REDIS_MAX_RETRIES: z.coerce.number().int().positive().default(10),
  REDIS_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  MAX_REFRESH_SESSIONS: z.coerce.number().int().positive().default(5),

  SOCKET_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  SOCKET_PATH: z.string().default('/socket.io'),
  SOCKET_REDIS_ADAPTER: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  SOCKET_MAX_EVENTS_PER_WINDOW: z.coerce.number().int().positive().default(50),
  SOCKET_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(10_000),
  SOCKET_HEARTBEAT_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
});

export type Env = z.infer<typeof envSchema>;
