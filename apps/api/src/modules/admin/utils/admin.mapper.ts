import type { UserDocument } from '../../users/interfaces/user.interface.js';
import type { ProviderMongoDocument } from '../../providers/interfaces/provider.interface.js';
import type { BreakdownMongoDocument } from '../../breakdown-requests/interfaces/breakdown.interface.js';
import { RequestPriority } from '../../breakdown-requests/constants/breakdown.enums.js';

export interface AdminUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserDocument['role'];
  profileImage?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProviderDto {
  id: string;
  userId: string;
  businessName: string;
  providerType: ProviderMongoDocument['providerType'];
  servicesOffered: string[];
  phoneNumber: string;
  email: string;
  profileImage?: string | null;
  currentLocation?: ProviderMongoDocument['currentLocation'];
  availabilityStatus: ProviderMongoDocument['availabilityStatus'];
  onlineStatus: ProviderMongoDocument['onlineStatus'];
  kycStatus: ProviderMongoDocument['kycStatus'];
  ratings: ProviderMongoDocument['ratings'];
  totalCompletedRequests: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStatsDto {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  activeBreakdownRequests: number;
  completedRequests: number;
  emergencyRequests: number;
  onlineProviders: number;
}

export interface AdminActivityItemDto {
  id: string;
  type: 'request' | 'user' | 'provider' | 'emergency' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

export interface AdminAnalyticsDto {
  requestsByStatus: Array<{ status: string; count: number }>;
  requestsPerDay: Array<{ date: string; count: number }>;
  providerActivity: Array<{ providerName: string; completedCount: number }>;
  emergencyRequestCount: number;
}

export function toAdminUser(user: UserDocument): AdminUserDto {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profileImage: user.profileImage ?? null,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAdminProvider(provider: ProviderMongoDocument): AdminProviderDto {
  return {
    id: provider._id.toString(),
    userId: provider.userId.toString(),
    businessName: provider.businessName,
    providerType: provider.providerType,
    servicesOffered: provider.servicesOffered ?? [],
    phoneNumber: provider.phoneNumber,
    email: provider.email,
    profileImage: provider.profileImage ?? null,
    currentLocation: provider.currentLocation ?? null,
    availabilityStatus: provider.availabilityStatus,
    onlineStatus: provider.onlineStatus,
    kycStatus: provider.kycStatus,
    ratings: provider.ratings ?? { average: 0, count: 0 },
    totalCompletedRequests: provider.totalCompletedRequests ?? 0,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export function toAdminActivityItem(request: BreakdownMongoDocument): AdminActivityItemDto {
  const isEmergency = request.priority === RequestPriority.EMERGENCY;

  return {
    id: request._id.toString(),
    type: isEmergency ? 'emergency' : 'request',
    title: `${request.issueType} — ${request.status}`,
    description: `Customer ${request.customerId.toString().slice(-6)} · ${
      request.assignedProviderId
        ? `Provider ${request.assignedProviderId.toString().slice(-6)}`
        : 'Unassigned'
    }`,
    timestamp: request.updatedAt.toISOString(),
  };
}
