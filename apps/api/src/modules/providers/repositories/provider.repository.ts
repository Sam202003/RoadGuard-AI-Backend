import { Types } from 'mongoose';
import { BaseRepository, type PaginatedResult, type PaginationParams } from '@roadguard/database';
import { ProviderModel } from '../schemas/provider.schema.js';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
} from '../constants/provider.enums.js';
import type { ProviderMongoDocument } from '../interfaces/provider.interface.js';

export interface NearbySearchParams {
  longitude: number;
  latitude: number;
  radiusKm: number;
  availabilityStatus?: AvailabilityStatus;
  onlineOnly?: boolean;
  kycVerifiedOnly?: boolean;
  providerType?: string;
  limit?: number;
}

const EARTH_RADIUS_KM = 6378.1;

export class ProviderRepository extends BaseRepository<ProviderMongoDocument> {
  constructor() {
    super(ProviderModel);
  }

  findByUserId(userId: string): Promise<ProviderMongoDocument | null> {
    return this.model.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  findAllWithBankDetails(): Promise<ProviderMongoDocument[]> {
    return this.model.find({ bankDetails: { $ne: null } }).exec();
  }

  async findNearbyWithDistance(
    params: NearbySearchParams,
  ): Promise<Array<{ provider: ProviderMongoDocument; distanceKm: number }>> {
    const {
      longitude,
      latitude,
      radiusKm,
      availabilityStatus = AvailabilityStatus.AVAILABLE,
      onlineOnly = true,
      kycVerifiedOnly = false,
      providerType,
      limit = 20,
    } = params;

    const maxDistanceMeters = radiusKm * 1000;

    const filter: Record<string, unknown> = {
      availabilityStatus,
    };

    if (onlineOnly) {
      filter.onlineStatus = OnlineStatus.ONLINE;
    }

    if (kycVerifiedOnly) {
      filter.kycStatus = KycStatus.VERIFIED;
    }

    if (providerType) {
      filter.providerType = providerType;
    }

    const providers = await this.model
      .find({
        ...filter,
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
      })
      .limit(limit)
      .exec();

    return providers.map((provider) => {
      const coords = provider.currentLocation?.coordinates;
      let distanceKm = 0;

      if (coords) {
        distanceKm = haversineKm(latitude, longitude, coords[1], coords[0]);
      }

      return { provider, distanceKm: Math.round(distanceKm * 100) / 100 };
    });
  }

  findPaginatedAdmin(
    params: PaginationParams & {
      availabilityStatus?: AvailabilityStatus;
      onlineStatus?: OnlineStatus;
    } = {},
  ): Promise<PaginatedResult<ProviderMongoDocument>> {
    const baseFilter: Record<string, unknown> = {};

    if (params.availabilityStatus) {
      baseFilter.availabilityStatus = params.availabilityStatus;
    }

    if (params.onlineStatus) {
      baseFilter.onlineStatus = params.onlineStatus;
    }

    return this.findPaginated({
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      search: params.search,
      baseFilter,
      searchFields: ['businessName', 'email', 'phoneNumber'],
    });
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
