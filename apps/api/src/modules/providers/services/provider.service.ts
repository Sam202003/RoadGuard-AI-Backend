import { Types } from 'mongoose';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
} from '../constants/provider.enums.js';
import type {
  NearbySearchInput,
  OnboardProviderInput,
  UpdateAvailabilityInput,
  UpdateLocationInput,
  UpdateProviderInput,
} from '../dto/provider.dto.js';
import type { NearbyProviderResult, SafeProvider } from '../interfaces/provider.interface.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { toNearbyProvider, toSafeProvider } from '../utils/provider.mapper.js';

export class ProviderService {
  constructor(private readonly providerRepository: ProviderRepository) {}

  private async getByUserIdOrThrow(userId: string) {
    const provider = await this.providerRepository.findByUserId(userId);

    if (!provider) {
      throw AppError.notFound('Provider profile not found');
    }

    return provider;
  }

  async onboardProvider(userId: string, input: OnboardProviderInput): Promise<SafeProvider> {
    const existing = await this.providerRepository.findByUserId(userId);

    if (existing) {
      throw new AppError('Provider profile already exists', HTTP_STATUS.CONFLICT);
    }

    const provider = await this.providerRepository.create({
      userId: new Types.ObjectId(userId),
      businessName: input.businessName,
      providerType: input.providerType,
      servicesOffered: input.servicesOffered,
      phoneNumber: input.phoneNumber,
      alternatePhoneNumber: input.alternatePhoneNumber ?? null,
      email: input.email,
      profileImage: input.profileImage ?? null,
      currentLocation: input.currentLocation ?? null,
      serviceRadius: input.serviceRadius ?? 10,
      availabilityStatus: AvailabilityStatus.OFFLINE,
      onlineStatus: OnlineStatus.OFFLINE,
      kycStatus: KycStatus.PENDING,
      ratings: { average: 0, count: 0 },
      totalCompletedRequests: 0,
      vehicleDetails: input.vehicleDetails ?? null,
      documents: input.documents ?? [],
      bankDetails: input.bankDetails ?? null,
    });

    return toSafeProvider(provider);
  }

  async getMyProfile(userId: string): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);
    return toSafeProvider(provider);
  }

  async updateMyProfile(userId: string, input: UpdateProviderInput): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);

    if (input.businessName !== undefined) provider.businessName = input.businessName;
    if (input.providerType !== undefined) provider.providerType = input.providerType;
    if (input.servicesOffered !== undefined) provider.servicesOffered = input.servicesOffered;
    if (input.phoneNumber !== undefined) provider.phoneNumber = input.phoneNumber;
    if (input.alternatePhoneNumber !== undefined) {
      provider.alternatePhoneNumber = input.alternatePhoneNumber;
    }
    if (input.email !== undefined) provider.email = input.email;
    if (input.profileImage !== undefined) provider.profileImage = input.profileImage;
    if (input.currentLocation !== undefined) provider.currentLocation = input.currentLocation;
    if (input.serviceRadius !== undefined) provider.serviceRadius = input.serviceRadius;
    if (input.vehicleDetails !== undefined) provider.vehicleDetails = input.vehicleDetails;
    if (input.documents !== undefined) provider.documents = input.documents;
    if (input.bankDetails !== undefined) provider.bankDetails = input.bankDetails;

    await provider.save();

    return toSafeProvider(provider);
  }

  async updateAvailability(
    userId: string,
    input: UpdateAvailabilityInput,
  ): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);

    if (input.availabilityStatus !== undefined) {
      provider.availabilityStatus = input.availabilityStatus;
    }

    if (input.onlineStatus !== undefined) {
      provider.onlineStatus = input.onlineStatus;
    }

    if (provider.onlineStatus === OnlineStatus.ONLINE && provider.availabilityStatus === AvailabilityStatus.OFFLINE) {
      provider.availabilityStatus = AvailabilityStatus.AVAILABLE;
    }

    await provider.save();

    return toSafeProvider(provider);
  }

  async updateLocation(userId: string, input: UpdateLocationInput): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);

    provider.currentLocation = input.currentLocation;

    if (input.serviceRadius !== undefined) {
      provider.serviceRadius = input.serviceRadius;
    }

    await provider.save();

    return toSafeProvider(provider);
  }

  async findNearbyProviders(query: NearbySearchInput): Promise<NearbyProviderResult[]> {
    const results = await this.providerRepository.findNearbyWithDistance({
      longitude: query.longitude,
      latitude: query.latitude,
      radiusKm: query.radiusKm,
      availabilityStatus: query.availabilityStatus ?? AvailabilityStatus.AVAILABLE,
      onlineOnly: query.onlineOnly ?? true,
      kycVerifiedOnly: query.kycVerifiedOnly ?? false,
      providerType: query.providerType,
      limit: query.limit ?? 20,
    });

    return results.map(({ provider, distanceKm }) => toNearbyProvider(provider, distanceKm));
  }
}
