import type { Request, Response } from 'express';
import { getMongoConnectionState, pingMongo } from '../../database/index.js';
import { getRedisConnectionState, pingRedis } from '../../redis/index.js';
import type { HealthCheckData } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.util.js';

export async function getHealth(req: Request, res: Response): Promise<void> {
  const { env, startedAt } = res.locals;
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  const [mongoPing, redisPing] = await Promise.all([pingMongo(), pingRedis()]);

  const data: HealthCheckData = {
    uptime: uptimeSeconds,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    infrastructure: {
      mongodb: {
        connected: mongoPing,
        state: getMongoConnectionState(),
      },
      redis: {
        connected: redisPing,
        state: getRedisConnectionState(),
      },
    },
  };

  sendSuccess(res, {
    message: 'Road Guard API running',
    data,
  });
}
