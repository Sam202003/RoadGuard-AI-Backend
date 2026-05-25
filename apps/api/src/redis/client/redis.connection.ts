import type { Env } from '@roadguard/config';
import {
  connectRedis,
  disconnectRedis,
  getRedisConnectionState,
  getRedisService,
  isRedisConnected,
  pingRedis,
} from '@roadguard/cache';

export async function connectRedisFromEnv(env: Env): Promise<void> {
  await connectRedis({
    url: env.REDIS_URL,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES,
    appName: env.APP_NAME,
  });
}

export {
  disconnectRedis,
  getRedisConnectionState,
  getRedisService,
  isRedisConnected,
  pingRedis,
};
