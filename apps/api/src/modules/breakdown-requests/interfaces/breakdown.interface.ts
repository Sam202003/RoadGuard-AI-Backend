import type { Document, Types } from 'mongoose';
import type { BaseEntity } from '@roadguard/database';
import type {
  BreakdownStatus,
  IssueType,
  RequestPriority,
} from '../constants/breakdown.enums.js';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IBreakdownRequest extends BaseEntity {
  customerId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  assignedProviderId?: Types.ObjectId | null;
  issueType: IssueType;
  issueDescription: string;
  images: string[];
  priority: RequestPriority;
  status: BreakdownStatus;
  location: GeoPoint;
  requestedAt: Date;
  assignedAt?: Date | null;
  arrivedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  estimatedArrivalTime?: number | null;
  estimatedDistance?: number | null;
  serviceCost?: number | null;
  cancellationReason?: string | null;
  aiDiagnosisSummary?: string | null;
  notes?: string | null;
  trackingEnabled: boolean;
}

export type BreakdownMongoDocument = IBreakdownRequest & Document<Types.ObjectId>;

export interface SafeBreakdownRequest {
  id: string;
  customerId: string;
  vehicleId: string;
  assignedProviderId?: string | null;
  issueType: IssueType;
  issueDescription: string;
  images: string[];
  priority: RequestPriority;
  status: BreakdownStatus;
  location: GeoPoint;
  requestedAt: string;
  assignedAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  estimatedArrivalTime?: number | null;
  estimatedDistance?: number | null;
  serviceCost?: number | null;
  cancellationReason?: string | null;
  aiDiagnosisSummary?: string | null;
  notes?: string | null;
  trackingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
