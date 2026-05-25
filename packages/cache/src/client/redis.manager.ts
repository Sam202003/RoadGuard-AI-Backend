import Redis, { type Redis as RedisClient, type RedisOptions } from 'ioredis';

export type RedisConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface RedisConnectOptions {
  url: string;
  maxRetriesPerRequest?: number;
  appName?: string;
}

let client: RedisClient | null = null;
let connectionState: RedisConnectionState = 'disconnected';

export function getRedisClient(): RedisClient {
  if (!client) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return client;
}

export function getRedisConnectionState(): RedisConnectionState {
  return connectionState;
}

export function isRedisConnected(): boolean {
  return connectionState === 'connected' && client?.status === 'ready';
}

export async function connectRedis(options: RedisConnectOptions): Promise<RedisClient> {
  if (client && isRedisConnected()) {
    return client;
  }

  connectionState = 'connecting';

  const redisOptions: RedisOptions = {
    maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
    retryStrategy(times) {
      if (times > (options.maxRetriesPerRequest ?? 10)) {
        return null;
      }
      return Math.min(times * 200, 5_000);
    },
    lazyConnect: true,
    connectionName: options.appName ?? 'roadguard',
  };

  const instance = new Redis(options.url, redisOptions);

  instance.on('connect', () => {
    connectionState = 'connected';
  });

  instance.on('ready', () => {
    connectionState = 'connected';
  });

  instance.on('close', () => {
    connectionState = 'disconnected';
  });

  instance.on('error', () => {
    if (connectionState !== 'disconnecting') {
      connectionState = 'disconnected';
    }
  });

  await instance.connect();
  client = instance;
  connectionState = 'connected';

  return instance;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) {
    connectionState = 'disconnected';
    return;
  }

  connectionState = 'disconnecting';
  await client.quit();
  client = null;
  connectionState = 'disconnected';
}

export async function pingRedis(): Promise<boolean> {
  if (!client) return false;

  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
