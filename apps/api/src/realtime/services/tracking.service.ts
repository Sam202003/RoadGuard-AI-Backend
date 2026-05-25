import type { Server } from 'socket.io';
import { UserRole } from '@roadguard/types';
import { getBreakdownRequestService } from '../../modules/breakdown-requests/index.js';
import { getProviderRepository } from '../../modules/providers/index.js';
import { ServerEvents } from '../socket/events/event.constants.js';
import { RoomNames } from '../socket/rooms/room.names.js';
import { haversineKm } from '../socket/utils/geo.util.js';
import { calculateEtaMinutes } from '../socket/utils/eta.util.js';
import { emitSocketError } from '../socket/middleware/socket-error.util.js';
import type {
  ProviderLocationUpdatedPayload,
  EtaUpdatedPayload,
} from '../interfaces/socket.types.js';
import type { ProviderLocationUpdatePayload } from '../validators/socket.validators.js';
import type { SocketData } from 'socket.io';
import type { Socket } from 'socket.io';

export class TrackingService {
  constructor(private readonly io: Server) {}

  async handleLocationUpdate(
    socket: Socket,
    payload: ProviderLocationUpdatePayload,
  ): Promise<void> {
    const data = socket.data as SocketData;

    if (data.user.role !== UserRole.PROVIDER || !data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'Only providers can send location updates');
      return;
    }

    const request = await getBreakdownRequestService()
      .getRequestById({ id: data.user.id, role: data.user.role }, payload.requestId)
      .catch(() => null);

    if (!request) {
      emitSocketError(socket, 'NOT_FOUND', 'Breakdown request not found or not assigned');
      return;
    }

    if (request.assignedProviderId !== data.user.providerId) {
      emitSocketError(socket, 'FORBIDDEN', 'You are not assigned to this request');
      return;
    }

    if (!request.trackingEnabled) {
      emitSocketError(socket, 'TRACKING_DISABLED', 'Tracking is disabled for this request');
      return;
    }

    const [destLon, destLat] = request.location.coordinates;
    const [provLon, provLat] = payload.location.coordinates;
    const distanceKm = haversineKm(destLat, destLon, provLat, provLon);
    const timestamp = payload.timestamp ?? new Date().toISOString();

    const locationPayload: ProviderLocationUpdatedPayload = {
      requestId: payload.requestId,
      providerId: data.user.providerId,
      location: payload.location,
      speed: payload.speed,
      heading: payload.heading,
      distanceKm,
      timestamp,
    };

    this.io
      .to(RoomNames.request(payload.requestId))
      .emit(ServerEvents.PROVIDER_LOCATION_UPDATED, locationPayload);

    this.io
      .to(RoomNames.adminMonitoring())
      .emit(ServerEvents.PROVIDER_LOCATION_UPDATED, locationPayload);

    const etaMinutes = calculateEtaMinutes(distanceKm, payload.speed);
    const etaPayload: EtaUpdatedPayload = {
      requestId: payload.requestId,
      providerId: data.user.providerId,
      estimatedArrivalMinutes: etaMinutes,
      estimatedDistanceKm: distanceKm,
      timestamp,
    };

    this.io.to(RoomNames.request(payload.requestId)).emit(ServerEvents.TRACKING_ETA_UPDATED, etaPayload);
    this.io.to(RoomNames.adminMonitoring()).emit(ServerEvents.TRACKING_ETA_UPDATED, etaPayload);

    const provider = await getProviderRepository().findById(data.user.providerId);
    if (provider) {
      provider.currentLocation = payload.location;
      await provider.save();
    }
  }
}
