import type { Server } from 'socket.io';
import { ServerEvents } from '../socket/events/event.constants.js';
import { RoomNames } from '../socket/rooms/room.names.js';
import type { SafeBreakdownRequest } from '../../modules/breakdown-requests/interfaces/breakdown.interface.js';
import type {
  ProviderAssignedPayload,
  RequestCancelledPayload,
  RequestStatusUpdatedPayload,
} from '../interfaces/socket.types.js';

export class BreakdownRealtimeGateway {
  constructor(private readonly io: Server) {}

  emitRequestCreated(request: SafeBreakdownRequest): void {
    const timestamp = new Date().toISOString();

    this.io
      .to(RoomNames.customer(request.customerId))
      .emit(ServerEvents.REQUEST_CREATED, { request, timestamp });

    this.io
      .to(RoomNames.request(request.id))
      .emit(ServerEvents.REQUEST_CREATED, { request, timestamp });

    this.io
      .to(RoomNames.adminMonitoring())
      .emit(ServerEvents.REQUEST_CREATED, { request, timestamp });

    if (request.assignedProviderId) {
      this.emitProviderAssigned(request, request.assignedProviderId);
    }
  }

  emitProviderAssigned(request: SafeBreakdownRequest, providerId: string): void {
    const payload: ProviderAssignedPayload = {
      request,
      providerId,
      timestamp: new Date().toISOString(),
    };

    this.io.to(RoomNames.request(request.id)).emit(ServerEvents.PROVIDER_ASSIGNED, payload);
    this.io.to(RoomNames.customer(request.customerId)).emit(ServerEvents.PROVIDER_ASSIGNED, payload);
    this.io.to(RoomNames.provider(providerId)).emit(ServerEvents.PROVIDER_ASSIGNED, payload);
    this.io.to(RoomNames.adminMonitoring()).emit(ServerEvents.PROVIDER_ASSIGNED, payload);
  }

  emitStatusUpdated(
    request: SafeBreakdownRequest,
    previousStatus?: string,
  ): void {
    const payload: RequestStatusUpdatedPayload = {
      request,
      previousStatus: previousStatus as RequestStatusUpdatedPayload['previousStatus'],
      timestamp: new Date().toISOString(),
    };

    this.io.to(RoomNames.request(request.id)).emit(ServerEvents.REQUEST_STATUS_UPDATED, payload);
    this.io.to(RoomNames.customer(request.customerId)).emit(ServerEvents.REQUEST_STATUS_UPDATED, payload);

    if (request.assignedProviderId) {
      this.io
        .to(RoomNames.provider(request.assignedProviderId))
        .emit(ServerEvents.REQUEST_STATUS_UPDATED, payload);
    }

    this.io.to(RoomNames.adminMonitoring()).emit(ServerEvents.REQUEST_STATUS_UPDATED, payload);
  }

  emitRequestCancelled(request: SafeBreakdownRequest): void {
    const payload: RequestCancelledPayload = {
      request,
      timestamp: new Date().toISOString(),
    };

    this.io.to(RoomNames.request(request.id)).emit(ServerEvents.REQUEST_CANCELLED, payload);
    this.io.to(RoomNames.customer(request.customerId)).emit(ServerEvents.REQUEST_CANCELLED, payload);

    if (request.assignedProviderId) {
      this.io
        .to(RoomNames.provider(request.assignedProviderId))
        .emit(ServerEvents.REQUEST_CANCELLED, payload);
    }

    this.io.to(RoomNames.adminMonitoring()).emit(ServerEvents.REQUEST_CANCELLED, payload);
  }
}
