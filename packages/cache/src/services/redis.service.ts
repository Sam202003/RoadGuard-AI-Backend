import { getRedisClient } from '../client/redis.manager.js';

export class RedisService {
  async get(key: string): Promise<string | null> {
    return getRedisClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await getRedisClient().set(key, value, 'EX', ttlSeconds);
      return;
    }
    await getRedisClient().set(key, value);
  }

  async del(key: string): Promise<number> {
    return getRedisClient().del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await getRedisClient().exists(key)) === 1;
  }

  async ping(): Promise<string> {
    return getRedisClient().ping();
  }
}

let redisService: RedisService | null = null;

export function getRedisService(): RedisService {
  if (!redisService) {
    redisService = new RedisService();
  }
  return redisService;
}
