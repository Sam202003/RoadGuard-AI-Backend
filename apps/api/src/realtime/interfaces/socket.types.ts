import type { UserRole } from '@roadguard/types';
import type { GeoPoint } from '../../modules/breakdown-requests/interfaces/breakdown.interface.js';
import type { BreakdownStatus } from '../../modules/breakdown-requests/constants/breakdown.enums.js';
import type { SafeBreakdownRequest } from '../../modules/breakdown-requests/interfaces/breakdown.interface.js';

export interface SocketUserContext {
  id: string;
  email: string;
  role: UserRole;
  providerId?: string;
}

export interface ProviderLocationPayload {
  requestId: string;
  location: GeoPoint;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface ProviderLocationUpdatedPayload {
  requestId: string;
  providerId: string;
  location: GeoPoint;
  speed?: number;
  heading?: number;
  distanceKm: number;
  timestamp: string;
}

export interface EtaUpdatedPayload {
  requestId: string;
  providerId: string;
  estimatedArrivalMinutes: number;
  estimatedDistanceKm: number;
  timestamp: string;
}

export interface RequestStatusUpdatedPayload {
  request: SafeBreakdownRequest;
  previousStatus?: BreakdownStatus;
  timestamp: string;
}

export interface ProviderAssignedPayload {
  request: SafeBreakdownRequest;
  providerId: string;
  timestamp: string;
}

export interface RequestCancelledPayload {
  request: SafeBreakdownRequest;
  timestamp: string;
}

export interface ProviderOnlineStatusPayload {
  providerId: string;
  userId: string;
  online: boolean;
  timestamp: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  timestamp: string;
}

export interface AuthConnectAckPayload {
  userId: string;
  role: UserRole;
  providerId?: string;
  socketId: string;
  timestamp: string;
}
