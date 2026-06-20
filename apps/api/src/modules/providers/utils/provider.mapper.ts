import type {
  NearbyProviderResult,
  ProviderMongoDocument,
  PublicNearbyProvider,
  SafeProvider,
} from '../interfaces/provider.interface.js';

export function toSafeProvider(provider: ProviderMongoDocument): SafeProvider {
  return {
    id: provider._id.toString(),
    userId: provider.userId.toString(),
    businessName: provider.businessName,
    providerType: provider.providerType,
    servicesOffered: provider.servicesOffered ?? [],
    phoneNumber: provider.phoneNumber,
    alternatePhoneNumber: provider.alternatePhoneNumber ?? null,
    email: provider.email,
    profileImage: provider.profileImage ?? null,
    currentLocation: provider.currentLocation ?? null,
    serviceRadius: provider.serviceRadius,
    availabilityStatus: provider.availabilityStatus,
    onlineStatus: provider.onlineStatus,
    kycStatus: provider.kycStatus,
    ratings: provider.ratings ?? { average: 0, count: 0 },
    totalCompletedRequests: provider.totalCompletedRequests ?? 0,
    vehicleDetails: provider.vehicleDetails ?? null,
    documents: provider.documents ?? [],
    bankDetails: provider.bankDetails ?? null,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export function toNearbyProvider(
  provider: ProviderMongoDocument,
  distanceKm?: number,
): NearbyProviderResult {
  return {
    ...toSafeProvider(provider),
    distanceKm,
  };
}

export function toPublicNearbyProvider(
  provider: ProviderMongoDocument,
  distanceKm?: number,
): PublicNearbyProvider {
  return {
    id: provider._id.toString(),
    businessName: provider.businessName,
    providerType: provider.providerType,
    servicesOffered: provider.servicesOffered ?? [],
    profileImage: provider.profileImage ?? null,
    currentLocation: provider.currentLocation ?? null,
    serviceRadius: provider.serviceRadius,
    availabilityStatus: provider.availabilityStatus,
    onlineStatus: provider.onlineStatus,
    kycStatus: provider.kycStatus,
    ratings: provider.ratings ?? { average: 0, count: 0 },
    totalCompletedRequests: provider.totalCompletedRequests ?? 0,
    distanceKm,
  };
}
