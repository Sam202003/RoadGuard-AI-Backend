import type { Env } from '@roadguard/config';
import type { Server, Socket } from 'socket.io';
import { UserRole } from '@roadguard/types';
import { ClientEvents, ServerEvents } from '../events/event.constants.js';
import type { SocketRateLimiter } from '../middleware/rate-limit.middleware.js';
import { emitSocketError } from '../middleware/socket-error.util.js';
import { getProviderRepository } from '../../../modules/providers/index.js';
import { assertKycVerified } from '../../../modules/providers/utils/kyc.util.js';
import type { PresenceService } from '../../services/presence.service.js';
import type { RequestRoomService } from '../../services/request-room.service.js';
import type { TrackingService } from '../../services/tracking.service.js';
import {
  authConnectSchema,
  heartbeatSchema,
  providerLocationUpdateSchema,
  providerPresenceSchema,
  requestRoomSchema,
} from '../../validators/socket.validators.js';

export interface HandlerDependencies {
  env: Env;
  io: Server;
  rateLimiter: SocketRateLimiter;
  presenceService: PresenceService;
  requestRoomService: RequestRoomService;
  trackingService: TrackingService;
}

export function registerSocketHandlers(
  socket: Socket,
  deps: HandlerDependencies,
): void {
  const { rateLimiter, presenceService, requestRoomService, trackingService } = deps;

  presenceService.registerConnection(socket.id, socket.data);
  presenceService.joinRoleRooms(socket.id, socket.data);

  socket.emit(ServerEvents.AUTH_CONNECTED, {
    userId: socket.data.user.id,
    role: socket.data.user.role,
    providerId: socket.data.user.providerId,
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });

  socket.on(ClientEvents.AUTH_CONNECT, (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    const parsed = authConnectSchema.safeParse(raw);
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid auth:connect payload');
      return;
    }

    socket.emit(ServerEvents.AUTH_CONNECTED, {
      userId: socket.data.user.id,
      role: socket.data.user.role,
      providerId: socket.data.user.providerId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on(ClientEvents.HEARTBEAT, (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    const parsed = heartbeatSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid heartbeat payload');
      return;
    }

    presenceService.recordHeartbeat(socket.id, socket.data);
    socket.emit(ServerEvents.HEARTBEAT_ACK, {
      timestamp: new Date().toISOString(),
    });
  });

  socket.on(ClientEvents.REQUEST_JOIN, async (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    const parsed = requestRoomSchema.safeParse(raw);
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid request:join payload');
      return;
    }

    await requestRoomService.joinRequestRoom(socket, parsed.data.requestId);
  });

  socket.on(ClientEvents.REQUEST_LEAVE, (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    const parsed = requestRoomSchema.safeParse(raw);
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid request:leave payload');
      return;
    }

    requestRoomService.leaveRequestRoom(socket, parsed.data.requestId);
  });

  socket.on(ClientEvents.PROVIDER_LOCATION_UPDATE, async (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    const parsed = providerLocationUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid provider:location:update payload');
      return;
    }

    await trackingService.handleLocationUpdate(socket, parsed.data);
  });

  socket.on(ClientEvents.PROVIDER_ONLINE, async (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    if (socket.data.user.role !== UserRole.PROVIDER || !socket.data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'Only providers can set online status');
      return;
    }

    const parsed = providerPresenceSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid provider:online payload');
      return;
    }

    const providerId = parsed.data.providerId ?? socket.data.user.providerId;
    if (providerId !== socket.data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'Cannot change another provider status');
      return;
    }

    const provider = await getProviderRepository().findById(providerId);
    if (!provider) {
      emitSocketError(socket, 'NOT_FOUND', 'Provider profile not found');
      return;
    }

    try {
      assertKycVerified(provider);
    } catch {
      emitSocketError(
        socket,
        'FORBIDDEN',
        'Provider KYC must be verified before going online',
      );
      return;
    }

    presenceService.setProviderOnline(providerId, socket.data.user.id, true);
  });

  socket.on(ClientEvents.PROVIDER_OFFLINE, (raw: unknown) => {
    if (!rateLimiter.check(socket)) return;

    if (socket.data.user.role !== UserRole.PROVIDER || !socket.data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'Only providers can set offline status');
      return;
    }

    const parsed = providerPresenceSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid provider:offline payload');
      return;
    }

    const providerId = parsed.data.providerId ?? socket.data.user.providerId;
    if (providerId !== socket.data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'Cannot change another provider status');
      return;
    }

    presenceService.setProviderOnline(providerId, socket.data.user.id, false);
  });

  socket.on('disconnect', () => {
    rateLimiter.clear(socket.id);
    presenceService.unregisterConnection(socket.id);
  });
}
