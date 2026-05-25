import type { Env } from '@roadguard/config';
import type { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, isRedisConnected } from '@roadguard/cache';
import { getLogger } from '../../../logger/index.js';

/**
 * Attaches the Redis adapter when SOCKET_REDIS_ADAPTER=true and Redis is connected.
 * Enables horizontal scaling across multiple API instances.
 */
export async function applyRedisAdapter(io: Server, env: Env): Promise<void> {
  if (!env.SOCKET_REDIS_ADAPTER) {
    return;
  }

  if (!isRedisConnected()) {
    getLogger().warn('SOCKET_REDIS_ADAPTER enabled but Redis is not connected — using in-memory adapter');
    return;
  }

  try {
    const pubClient = getRedisClient();
    const subClient = pubClient.duplicate();

    if (subClient.status === 'wait') {
      await subClient.connect();
    }

    io.adapter(createAdapter(pubClient, subClient));
    getLogger().info('Socket.IO Redis adapter attached');
  } catch (error) {
    getLogger().error({ err: error }, 'Failed to attach Socket.IO Redis adapter');
  }
}
