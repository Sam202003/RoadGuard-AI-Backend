import type { Env } from '@roadguard/config';
import { getLogger } from '../logger/index.js';
import { initLogger } from '../logger/index.js';
import { connectMongoFromEnv, disconnectMongo } from '../database/index.js';
import { connectRedisFromEnv, disconnectRedis } from '../redis/index.js';
import { initAdminModule } from '../modules/admin/index.js';
import { initAiModule } from '../modules/ai/index.js';
import { initAuthModule } from '../modules/auth/index.js';
import { initBreakdownRequestsModule } from '../modules/breakdown-requests/index.js';
import { initNotificationsModule } from '../modules/notifications/index.js';
import { initProvidersModule } from '../modules/providers/index.js';
import { initVehiclesModule } from '../modules/vehicles/index.js';

export async function connectInfrastructure(env: Env): Promise<void> {
  initLogger(env);
  const logger = getLogger();

  logger.info('Connecting to MongoDB…');
  await connectMongoFromEnv(env);
  logger.info('MongoDB connected');

  if (env.REDIS_ENABLED) {
    logger.info('Connecting to Redis…');
    await connectRedisFromEnv(env);
    logger.info('Redis connected');
  } else {
    logger.warn('Redis disabled (REDIS_ENABLED=false) — cache and socket Redis adapter unavailable');
  }

  initAuthModule(env);
  initAiModule(env);
  initVehiclesModule();
  initProvidersModule(env);
  initNotificationsModule();
  initBreakdownRequestsModule();
  initAdminModule();
  logger.info('Auth, AI, users, vehicles, providers, notifications, breakdown-requests & admin modules initialized');
}

export async function disconnectInfrastructure(): Promise<void> {
  const logger = getLogger();

  logger.info('Disconnecting Redis…');
  await disconnectRedis();
  logger.info('Disconnecting MongoDB…');
  await disconnectMongo();
  logger.info('Infrastructure disconnected');
}
