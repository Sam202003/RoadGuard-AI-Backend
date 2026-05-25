import type { Server as HttpServer } from 'node:http';
import type { Env } from '@roadguard/config';
import type { Server } from 'socket.io';
import { getLogger } from '../logger/index.js';
import type { BreakdownRealtimeGateway } from './gateways/breakdown-realtime.gateway.js';
import {
  createRealtimeServer,
  type RealtimeServerContext,
} from './socket/server/socket-server.factory.js';
import type { PresenceService } from './services/presence.service.js';

let io: Server | null = null;
let gateway: BreakdownRealtimeGateway | null = null;
let presenceService: PresenceService | null = null;

export async function initRealtime(env: Env, httpServer: HttpServer): Promise<void> {
  if (!env.SOCKET_ENABLED) {
    getLogger().info('Socket.IO disabled (SOCKET_ENABLED=false)');
    return;
  }

  const ctx: RealtimeServerContext = await createRealtimeServer(httpServer, env);
  io = ctx.io;
  gateway = ctx.gateway;
  presenceService = ctx.presenceService;
}

export function getRealtimeGateway(): BreakdownRealtimeGateway {
  if (!gateway) {
    throw new Error('Realtime module not initialized or sockets disabled');
  }
  return gateway;
}

export function isRealtimeEnabled(): boolean {
  return gateway !== null;
}

export function getSocketIo(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized or disabled');
  }
  return io;
}

export async function shutdownRealtime(): Promise<void> {
  if (!io) return;

  presenceService?.stopHeartbeatMonitor();

  await new Promise<void>((resolve, reject) => {
    io!.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  io = null;
  gateway = null;
  presenceService = null;

  getLogger().info('Socket.IO server closed');
}

export { ClientEvents, ServerEvents } from './socket/events/event.constants.js';
export { RoomNames } from './socket/rooms/room.names.js';
