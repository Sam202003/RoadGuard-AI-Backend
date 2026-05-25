import type { Server as HttpServer } from 'node:http';
import type { Env } from '@roadguard/config';
import { Server } from 'socket.io';
import { getLogger } from '../../../logger/index.js';
import { BreakdownRealtimeGateway } from '../../gateways/breakdown-realtime.gateway.js';
import { PresenceService } from '../../services/presence.service.js';
import { RequestRoomService } from '../../services/request-room.service.js';
import { TrackingService } from '../../services/tracking.service.js';
import { applyRedisAdapter } from '../adapters/redis.adapter.js';
import { createSocketAuthMiddleware } from '../middleware/socket-auth.middleware.js';
import { createRateLimiter } from '../middleware/rate-limit.middleware.js';
import { InMemoryPresenceStore } from '../presence/in-memory.presence.js';
import { registerSocketHandlers, type HandlerDependencies } from '../handlers/register.handlers.js';

export interface RealtimeServerContext {
  io: Server;
  gateway: BreakdownRealtimeGateway;
  presenceService: PresenceService;
}

export async function createRealtimeServer(
  httpServer: HttpServer,
  env: Env,
): Promise<RealtimeServerContext> {
  const io = new Server(httpServer, {
    path: env.SOCKET_PATH,
    cors: {
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  await applyRedisAdapter(io, env);

  const presenceStore = new InMemoryPresenceStore();
  const presenceService = new PresenceService(io, presenceStore, env);
  const requestRoomService = new RequestRoomService();
  const trackingService = new TrackingService(io);
  const gateway = new BreakdownRealtimeGateway(io);
  const rateLimiter = createRateLimiter(env);

  io.use(createSocketAuthMiddleware(env));

  io.on('connection', (socket) => {
    const deps: HandlerDependencies = {
      env,
      io,
      rateLimiter,
      presenceService,
      requestRoomService,
      trackingService,
    };

    registerSocketHandlers(socket, deps);
  });

  presenceService.startHeartbeatMonitor();

  getLogger().info(
    { path: env.SOCKET_PATH, redisAdapter: env.SOCKET_REDIS_ADAPTER },
    'Socket.IO realtime server initialized',
  );

  return { io, gateway, presenceService };
}
