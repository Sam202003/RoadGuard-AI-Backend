import type { Server } from 'socket.io';
import { UserRole } from '@roadguard/types';
import type { Env } from '@roadguard/config';
import { getLogger } from '../../logger/index.js';
import { ServerEvents } from '../socket/events/event.constants.js';
import type { PresenceStore } from '../socket/presence/presence.store.js';
import { RoomNames } from '../socket/rooms/room.names.js';
import type { SocketData } from 'socket.io';
import type { ProviderOnlineStatusPayload } from '../interfaces/socket.types.js';

export class PresenceService {
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly io: Server,
    private readonly store: PresenceStore,
    private readonly env: Env,
  ) {}

  registerConnection(socketId: string, data: SocketData): void {
    this.store.addSession({
      socketId,
      userId: data.user.id,
      role: data.user.role,
      providerId: data.user.providerId,
      connectedAt: new Date(data.connectedAt),
      lastHeartbeat: new Date(data.lastHeartbeat),
    });
  }

  unregisterConnection(socketId: string): void {
    const session = this.store.removeSession(socketId);
    if (session?.providerId) {
      const stillOnline = this.store
        .getSessionsByUserId(session.userId)
        .some((s) => s.providerId === session.providerId);

      if (!stillOnline) {
        this.store.setProviderOnline(session.providerId, false);
        this.broadcastProviderOnlineStatus(session.providerId, session.userId, false);
      }
    }
  }

  recordHeartbeat(socketId: string, data: SocketData): void {
    data.lastHeartbeat = new Date().toISOString();
    this.store.updateHeartbeat(socketId);
  }

  setProviderOnline(providerId: string, userId: string, online: boolean): void {
    this.store.setProviderOnline(providerId, online);
    this.broadcastProviderOnlineStatus(providerId, userId, online);
  }

  private broadcastProviderOnlineStatus(
    providerId: string,
    userId: string,
    online: boolean,
  ): void {
    const payload: ProviderOnlineStatusPayload = {
      providerId,
      userId,
      online,
      timestamp: new Date().toISOString(),
    };

    this.io.to(RoomNames.provider(providerId)).emit(ServerEvents.PROVIDER_ONLINE_STATUS, payload);
    this.io.to(RoomNames.adminMonitoring()).emit(ServerEvents.PROVIDER_ONLINE_STATUS, payload);
  }

  startHeartbeatMonitor(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      const stale = this.store.getStaleSessions(this.env.SOCKET_HEARTBEAT_TIMEOUT_MS);
      for (const session of stale) {
        const socket = this.io.sockets.sockets.get(session.socketId);
        if (socket) {
          getLogger().warn({ socketId: session.socketId }, 'Disconnecting stale socket');
          socket.disconnect(true);
        } else {
          this.unregisterConnection(session.socketId);
        }
      }
    }, 30_000);
  }

  stopHeartbeatMonitor(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  joinRoleRooms(socketId: string, data: SocketData): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) return;

    const { user } = data;

    socket.join(RoomNames.user(user.id));

    if (user.role === UserRole.CUSTOMER) {
      socket.join(RoomNames.customer(user.id));
    }

    if (user.role === UserRole.PROVIDER && user.providerId) {
      socket.join(RoomNames.provider(user.providerId));
    }

    if (user.role === UserRole.ADMIN) {
      socket.join(RoomNames.adminMonitoring());
    }
  }
}
