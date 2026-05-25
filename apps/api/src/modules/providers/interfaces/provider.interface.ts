import type { Document, Types } from 'mongoose';
import type { BaseEntity } from '@roadguard/database';
import type {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
  ProviderType,
} from '../constants/provider.enums.js';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface ProviderRatings {
  average: number;
  count: number;
}

export interface ProviderVehicleDetails {
  type?: string;
  brand?: string;
  model?: string;
  registrationNumber?: string;
}

export interface ProviderDocumentFile {
  name: string;
  url: string;
  type: string;
  uploadedAt?: Date;
}

export interface ProviderBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface IProvider extends BaseEntity {
  userId: Types.ObjectId;
  businessName: string;
  providerType: ProviderType;
  servicesOffered: string[];
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  email: string;
  profileImage?: string | null;
  currentLocation?: GeoPoint | null;
  serviceRadius: number;
  availabilityStatus: AvailabilityStatus;
  onlineStatus: OnlineStatus;
  kycStatus: KycStatus;
  ratings: ProviderRatings;
  totalCompletedRequests: number;
  vehicleDetails?: ProviderVehicleDetails | null;
  documents: ProviderDocumentFile[];
  bankDetails?: ProviderBankDetails | null;
}

export type ProviderMongoDocument = IProvider & Document<Types.ObjectId>;

export interface SafeProvider {
  id: string;
  userId: string;
  businessName: string;
  providerType: ProviderType;
  servicesOffered: string[];
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  email: string;
  profileImage?: string | null;
  currentLocation?: GeoPoint | null;
  serviceRadius: number;
  availabilityStatus: AvailabilityStatus;
  onlineStatus: OnlineStatus;
  kycStatus: KycStatus;
  ratings: ProviderRatings;
  totalCompletedRequests: number;
  vehicleDetails?: ProviderVehicleDetails | null;
  documents: ProviderDocumentFile[];
  bankDetails?: ProviderBankDetails | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NearbyProviderResult extends SafeProvider {
  distanceKm?: number;
}
