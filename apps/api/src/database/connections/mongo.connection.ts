import type { Env } from '@roadguard/config';
import {
  connectMongo,
  disconnectMongo,
  getMongoConnectionState,
  isMongoConnected,
  pingMongo,
} from '@roadguard/database';

export async function connectMongoFromEnv(env: Env): Promise<void> {
  await connectMongo({
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME,
    maxRetries: env.MONGODB_MAX_RETRIES,
    retryDelayMs: env.MONGODB_RETRY_DELAY_MS,
    appName: env.APP_NAME,
  });
}

export {
  disconnectMongo,
  getMongoConnectionState,
  isMongoConnected,
  pingMongo,
};
