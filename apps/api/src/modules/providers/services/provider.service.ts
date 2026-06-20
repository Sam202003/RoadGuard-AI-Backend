import type { Env } from '@roadguard/config';
import { Types } from 'mongoose';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
} from '../constants/provider.enums.js';
import {
  bankDetailsNeedsEncryption,
  decryptBankDetails,
  encryptBankDetails,
} from '../utils/bank-details.util.js';
import { assertKycVerified } from '../utils/kyc.util.js';
import type {
  NearbySearchInput,
  OnboardProviderInput,
  UpdateAvailabilityInput,
  UpdateLocationInput,
  UpdateProviderInput,
} from '../dto/provider.dto.js';
import type {
  NearbyProviderResult,
  ProviderMongoDocument,
  SafeProvider,
} from '../interfaces/provider.interface.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { toPublicNearbyProvider, toSafeProvider } from '../utils/provider.mapper.js';
import type { PublicNearbyProvider } from '../interfaces/provider.interface.js';

export class ProviderService {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly env: Env,
  ) {}

  private get encryptionKey(): string | undefined {
    return this.env.FIELD_ENCRYPTION_KEY;
  }

  private withDecryptedBankDetails(provider: ProviderMongoDocument): ProviderMongoDocument {
    provider.bankDetails = decryptBankDetails(
      provider.bankDetails as Parameters<typeof decryptBankDetails>[0],
      this.encryptionKey,
    );
    return provider;
  }

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
      bankDetails: encryptBankDetails(input.bankDetails ?? null, this.encryptionKey),
    });

    return toSafeProvider(this.withDecryptedBankDetails(provider));
  }

  async getMyProfile(userId: string): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);
    return toSafeProvider(this.withDecryptedBankDetails(provider));
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
    if (input.bankDetails !== undefined) {
      provider.bankDetails = encryptBankDetails(input.bankDetails, this.encryptionKey);
    }

    await provider.save();

    return toSafeProvider(this.withDecryptedBankDetails(provider));
  }

  async updateAvailability(
    userId: string,
    input: UpdateAvailabilityInput,
  ): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);

    const goingOnline =
      input.onlineStatus === OnlineStatus.ONLINE ||
      (input.availabilityStatus !== undefined &&
        input.availabilityStatus !== AvailabilityStatus.OFFLINE &&
        provider.onlineStatus === OnlineStatus.ONLINE);

    if (goingOnline) {
      assertKycVerified(provider);
    }

    if (input.availabilityStatus !== undefined) {
      if (
        input.availabilityStatus !== AvailabilityStatus.OFFLINE &&
        provider.onlineStatus === OnlineStatus.ONLINE
      ) {
        assertKycVerified(provider);
      }
      provider.availabilityStatus = input.availabilityStatus;
    }

    if (input.onlineStatus !== undefined) {
      if (input.onlineStatus === OnlineStatus.ONLINE) {
        assertKycVerified(provider);
      }
      provider.onlineStatus = input.onlineStatus;
    }

    if (provider.onlineStatus === OnlineStatus.ONLINE && provider.availabilityStatus === AvailabilityStatus.OFFLINE) {
      provider.availabilityStatus = AvailabilityStatus.AVAILABLE;
    }

    await provider.save();

    return toSafeProvider(this.withDecryptedBankDetails(provider));
  }

  async updateLocation(userId: string, input: UpdateLocationInput): Promise<SafeProvider> {
    const provider = await this.getByUserIdOrThrow(userId);

    if (provider.onlineStatus === OnlineStatus.ONLINE) {
      assertKycVerified(provider);
    }

    provider.currentLocation = input.currentLocation;

    if (input.serviceRadius !== undefined) {
      provider.serviceRadius = input.serviceRadius;
    }

    await provider.save();

    return toSafeProvider(this.withDecryptedBankDetails(provider));
  }

  async updateKycStatus(
    providerId: string,
    kycStatus: KycStatus,
  ): Promise<SafeProvider> {
    const provider = await this.providerRepository.findById(providerId);

    if (!provider) {
      throw AppError.notFound('Provider not found');
    }

    provider.kycStatus = kycStatus;

    if (kycStatus !== KycStatus.VERIFIED) {
      provider.onlineStatus = OnlineStatus.OFFLINE;
      provider.availabilityStatus = AvailabilityStatus.OFFLINE;
    }

    await provider.save();

    return toSafeProvider(this.withDecryptedBankDetails(provider));
  }

  async migratePlaintextBankDetails(): Promise<{ updated: number }> {
    if (!this.encryptionKey) {
      throw new AppError('FIELD_ENCRYPTION_KEY is not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const providers = await this.providerRepository.findAllWithBankDetails();
    let updated = 0;

    for (const provider of providers) {
      if (!bankDetailsNeedsEncryption(provider.bankDetails)) continue;
      provider.bankDetails = encryptBankDetails(provider.bankDetails, this.encryptionKey);
      await provider.save();
      updated += 1;
    }

    return { updated };
  }

  async findNearbyProviders(query: NearbySearchInput): Promise<PublicNearbyProvider[]> {
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

    return results.map(({ provider, distanceKm }) => toPublicNearbyProvider(provider, distanceKm));
  }
}
