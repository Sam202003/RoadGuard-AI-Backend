import { Types } from 'mongoose';
import { UserRole } from '@roadguard/types';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import {
  AvailabilityStatus,
  OnlineStatus,
} from '../../providers/constants/provider.enums.js';
import type { ProviderMongoDocument } from '../../providers/interfaces/provider.interface.js';
import { getProviderRepository } from '../../providers/index.js';
import { getVehicleService } from '../../vehicles/index.js';
import {
  BreakdownStatus,
  IssueType,
  RequestPriority,
} from '../constants/breakdown.enums.js';
import type {
  AssignProviderBody,
  CancelBreakdownRequestBody,
  CreateBreakdownRequestBody,
  ListBreakdownRequestsQuery,
  UpdateBreakdownStatusBody,
} from '../validators/breakdown.validator.js';
import type { SafeBreakdownRequest } from '../interfaces/breakdown.interface.js';
import { BreakdownRequestRepository } from '../repositories/breakdown.repository.js';
import { toSafeBreakdownRequest } from '../utils/breakdown.mapper.js';
import { estimateArrivalMinutes } from '../utils/estimate-arrival.js';
import { getPreferredProviderTypes } from '../utils/issue-provider-map.js';
import { canTransition, isTerminalStatus } from '../utils/status-transitions.js';
import { getRealtimeGateway, isRealtimeEnabled } from '../../../realtime/index.js';
import { getBreakdownNotificationsIntegration } from '../../notifications/index.js';

interface AuthUser {
  id: string;
  role: UserRole;
}

const PROVIDER_PROGRESS_STATUSES: BreakdownStatus[] = [
  BreakdownStatus.ON_THE_WAY,
  BreakdownStatus.ARRIVED,
  BreakdownStatus.IN_PROGRESS,
  BreakdownStatus.COMPLETED,
];

export class BreakdownRequestService {
  constructor(private readonly breakdownRepository: BreakdownRequestRepository) {}

  private emitRealtime(emit: () => void): void {
    if (!isRealtimeEnabled()) return;
    try {
      emit();
    } catch {
      // Realtime optional — HTTP flow must succeed
    }
  }

  private emitNotifications(work: () => Promise<void>): void {
    work().catch(() => {
      // Notifications must not block HTTP responses
    });
  }

  private async getRequestOrThrow(id: string) {
    const request = await this.breakdownRepository.findById(id);

    if (!request) {
      throw AppError.notFound('Breakdown request not found');
    }

    return request;
  }

  private resolvePriority(
    issueType: IssueType,
    requested?: RequestPriority,
  ): RequestPriority {
    if (requested === RequestPriority.EMERGENCY || issueType === IssueType.ACCIDENT) {
      return RequestPriority.EMERGENCY;
    }
    return requested ?? RequestPriority.MEDIUM;
  }

  private assertNotTerminal(status: BreakdownStatus): void {
    if (isTerminalStatus(status)) {
      throw new AppError('Request cannot be modified in its current state', HTTP_STATUS.CONFLICT);
    }
  }

  private async assertCanView(user: AuthUser, request: { customerId: Types.ObjectId; assignedProviderId?: Types.ObjectId | null }): Promise<void> {
    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.CUSTOMER) {
      if (request.customerId.toString() !== user.id) {
        throw AppError.forbidden('You can only view your own breakdown requests');
      }
      return;
    }

    if (user.role === UserRole.PROVIDER) {
      const provider = await getProviderRepository().findByUserId(user.id);
      if (!provider) {
        throw AppError.forbidden('Provider profile not found');
      }
      if (request.assignedProviderId?.toString() !== provider._id.toString()) {
        throw AppError.forbidden('You can only view requests assigned to you');
      }
      return;
    }

    throw AppError.forbidden();
  }

  private async findNearestEligibleProvider(
    longitude: number,
    latitude: number,
    issueType: IssueType,
    searchRadiusKm: number,
  ): Promise<{ provider: ProviderMongoDocument; distanceKm: number } | null> {
    const providerRepository = getProviderRepository();
    const preferredTypes = getPreferredProviderTypes(issueType);
    const byId = new Map<string, { provider: ProviderMongoDocument; distanceKm: number }>();

    for (const providerType of preferredTypes) {
      const results = await providerRepository.findNearbyWithDistance({
        longitude,
        latitude,
        radiusKm: searchRadiusKm,
        providerType,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        onlineOnly: true,
      });

      for (const row of results) {
        if (row.distanceKm > row.provider.serviceRadius) continue;
        const id = row.provider._id.toString();
        const existing = byId.get(id);
        if (!existing || row.distanceKm < existing.distanceKm) {
          byId.set(id, row);
        }
      }
    }

    const sorted = [...byId.values()].sort((a, b) => a.distanceKm - b.distanceKm);
    return sorted[0] ?? null;
  }

  private async assignProviderToRequest(
    request: Awaited<ReturnType<typeof this.getRequestOrThrow>>,
    provider: ProviderMongoDocument,
    distanceKm: number,
  ): Promise<void> {
    if (provider.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
      throw new AppError('Provider is not available for assignment', HTTP_STATUS.CONFLICT);
    }

    if (provider.onlineStatus !== OnlineStatus.ONLINE) {
      throw new AppError('Provider must be online for assignment', HTTP_STATUS.CONFLICT);
    }

    const [lon, lat] = request.location.coordinates;
    const providerCoords = provider.currentLocation?.coordinates;
    const distance =
      distanceKm > 0
        ? distanceKm
        : providerCoords
          ? haversineKm(lat, lon, providerCoords[1], providerCoords[0])
          : 0;

    request.assignedProviderId = provider._id;
    request.assignedAt = new Date();
    request.estimatedDistance = Math.round(distance * 100) / 100;
    request.estimatedArrivalTime = estimateArrivalMinutes(distance);
    request.status = BreakdownStatus.PROVIDER_ASSIGNED;

    provider.availabilityStatus = AvailabilityStatus.BUSY;
    await Promise.all([request.save(), provider.save()]);
  }

  private async releaseProviderIfAssigned(
    providerId: Types.ObjectId | null | undefined,
  ): Promise<void> {
    if (!providerId) return;

    const provider = await getProviderRepository().findById(providerId.toString());
    if (!provider) return;

    provider.availabilityStatus = AvailabilityStatus.AVAILABLE;
    await provider.save();
  }

  async createRequest(
    customerId: string,
    input: CreateBreakdownRequestBody,
  ): Promise<SafeBreakdownRequest> {
    await getVehicleService().getVehicleById(customerId, input.vehicleId);

    const priority = this.resolvePriority(input.issueType, input.priority);
    const [longitude, latitude] = input.location.coordinates;
    const now = new Date();

    let request = await this.breakdownRepository.create({
      customerId: new Types.ObjectId(customerId),
      vehicleId: new Types.ObjectId(input.vehicleId),
      issueType: input.issueType,
      issueDescription: input.issueDescription,
      images: input.images ?? [],
      priority,
      status: BreakdownStatus.CREATED,
      location: input.location,
      requestedAt: now,
      aiDiagnosisSummary: input.aiDiagnosisSummary ?? null,
      notes: input.notes ?? null,
      trackingEnabled: input.trackingEnabled ?? true,
    });

    request.status = BreakdownStatus.SEARCHING_PROVIDER;
    await request.save();

    const nearest = await this.findNearestEligibleProvider(
      longitude,
      latitude,
      input.issueType,
      input.searchRadiusKm ?? 15,
    );

    if (nearest) {
      await this.assignProviderToRequest(request, nearest.provider, nearest.distanceKm);
      request = (await this.breakdownRepository.findById(request._id.toString()))!;
    }

    const safe = toSafeBreakdownRequest(request);
    this.emitRealtime(() => getRealtimeGateway().emitRequestCreated(safe));
    this.emitNotifications(() =>
      getBreakdownNotificationsIntegration().onBreakdownCreated(safe),
    );
    return safe;
  }

  async listRequests(
    user: AuthUser,
    query: ListBreakdownRequestsQuery,
  ): Promise<{ requests: SafeBreakdownRequest[]; meta: Record<string, unknown> }> {
    const paginationParams = {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
      filters:
        query.status !== undefined
          ? ({ status: query.status } as Record<string, unknown>)
          : undefined,
    };

    let result;

    if (user.role === UserRole.ADMIN) {
      result = await this.breakdownRepository.findAllPaginated(paginationParams);
    } else if (user.role === UserRole.CUSTOMER) {
      result = await this.breakdownRepository.findByCustomerPaginated(
        user.id,
        paginationParams,
      );
    } else if (user.role === UserRole.PROVIDER) {
      const provider = await getProviderRepository().findByUserId(user.id);
      if (!provider) {
        throw AppError.notFound('Provider profile not found');
      }
      result = await this.breakdownRepository.findByAssignedProviderPaginated(
        provider._id.toString(),
        paginationParams,
      );
    } else {
      throw AppError.forbidden();
    }

    return {
      requests: result.data.map(toSafeBreakdownRequest),
      meta: result.meta as unknown as Record<string, unknown>,
    };
  }

  async getRequestById(user: AuthUser, id: string): Promise<SafeBreakdownRequest> {
    const request = await this.getRequestOrThrow(id);
    await this.assertCanView(user, request);
    return toSafeBreakdownRequest(request);
  }

  async updateStatus(
    user: AuthUser,
    id: string,
    input: UpdateBreakdownStatusBody,
  ): Promise<SafeBreakdownRequest> {
    const request = await this.getRequestOrThrow(id);
    this.assertNotTerminal(request.status);

    if (user.role === UserRole.PROVIDER) {
      const provider = await getProviderRepository().findByUserId(user.id);
      if (!provider || request.assignedProviderId?.toString() !== provider._id.toString()) {
        throw AppError.forbidden('Only the assigned provider can update this request');
      }
      if (!PROVIDER_PROGRESS_STATUSES.includes(input.status)) {
        throw AppError.forbidden('Providers cannot set this status');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw AppError.forbidden('Insufficient permissions to update status');
    }

    if (!canTransition(request.status, input.status)) {
      throw new AppError(
        `Invalid status transition from ${request.status} to ${input.status}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const previousStatus = request.status;
    const now = new Date();
    request.status = input.status;

    if (input.notes !== undefined) request.notes = input.notes;
    if (input.serviceCost !== undefined) request.serviceCost = input.serviceCost;

    if (input.status === BreakdownStatus.ARRIVED) request.arrivedAt = now;
    if (input.status === BreakdownStatus.COMPLETED) {
      request.completedAt = now;
      if (request.assignedProviderId) {
        const provider = await getProviderRepository().findById(
          request.assignedProviderId.toString(),
        );
        if (provider) {
          provider.totalCompletedRequests += 1;
          provider.availabilityStatus = AvailabilityStatus.AVAILABLE;
          await provider.save();
        }
      }
    }

    await request.save();
    const safe = toSafeBreakdownRequest(request);
    this.emitRealtime(() =>
      getRealtimeGateway().emitStatusUpdated(safe, previousStatus),
    );
    this.emitNotifications(() =>
      getBreakdownNotificationsIntegration().onStatusUpdated(safe, previousStatus),
    );
    return safe;
  }

  async assignProvider(
    user: AuthUser,
    id: string,
    input: AssignProviderBody,
  ): Promise<SafeBreakdownRequest> {
    if (user.role !== UserRole.ADMIN) {
      throw AppError.forbidden('Only admins can manually assign providers');
    }

    const request = await this.getRequestOrThrow(id);
    this.assertNotTerminal(request.status);

    if (
      request.status !== BreakdownStatus.SEARCHING_PROVIDER &&
      request.status !== BreakdownStatus.CREATED
    ) {
      throw new AppError(
        'Provider can only be assigned while searching for a provider',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const provider = await getProviderRepository().findById(input.providerId);
    if (!provider) {
      throw AppError.notFound('Provider not found');
    }

    if (request.assignedProviderId) {
      await this.releaseProviderIfAssigned(request.assignedProviderId);
    }

    const [lon, lat] = request.location.coordinates;
    const coords = provider.currentLocation?.coordinates;
    const distanceKm = coords ? haversineKm(lat, lon, coords[1], coords[0]) : 0;

    await this.assignProviderToRequest(request, provider, distanceKm);

    const updated = await this.getRequestOrThrow(id);
    const safe = toSafeBreakdownRequest(updated);
    this.emitRealtime(() =>
      getRealtimeGateway().emitProviderAssigned(safe, input.providerId),
    );
    this.emitNotifications(() =>
      getBreakdownNotificationsIntegration().onProviderAssigned(safe, input.providerId),
    );
    return safe;
  }

  async cancelRequest(
    user: AuthUser,
    id: string,
    input: CancelBreakdownRequestBody,
  ): Promise<SafeBreakdownRequest> {
    const request = await this.getRequestOrThrow(id);
    this.assertNotTerminal(request.status);

    if (user.role === UserRole.CUSTOMER) {
      if (request.customerId.toString() !== user.id) {
        throw AppError.forbidden('You can only cancel your own breakdown requests');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw AppError.forbidden('Insufficient permissions to cancel this request');
    }

    if (!canTransition(request.status, BreakdownStatus.CANCELLED)) {
      throw new AppError(
        `Cannot cancel request in status ${request.status}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await this.releaseProviderIfAssigned(request.assignedProviderId ?? undefined);

    request.status = BreakdownStatus.CANCELLED;
    request.cancelledAt = new Date();
    request.cancellationReason = input.cancellationReason;
    await request.save();

    const safe = toSafeBreakdownRequest(request);
    this.emitRealtime(() => getRealtimeGateway().emitRequestCancelled(safe));
    this.emitNotifications(() =>
      getBreakdownNotificationsIntegration().onRequestCancelled(safe),
    );
    return safe;
  }
}

const EARTH_RADIUS_KM = 6378.1;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}
