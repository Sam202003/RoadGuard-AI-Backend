import type { Document, Types } from 'mongoose';
import type { BaseEntity } from '@roadguard/database';
import type { FuelType, TransmissionType, VehicleDocumentType, VehicleType } from '../constants/vehicle.enums.js';

export interface VehicleDocumentFile {
  name: string;
  url: string;
  type: VehicleDocumentType;
  uploadedAt?: Date;
}

export interface IVehicle extends BaseEntity {
  ownerId: Types.ObjectId;
  vehicleType: VehicleType;
  brand: string;
  vehicleModel: string;
  year: number;
  registrationNumber: string;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  color?: string | null;
  insuranceExpiryDate?: Date | null;
  pollutionExpiryDate?: Date | null;
  serviceDueDate?: Date | null;
  vehicleImages: string[];
  documents: VehicleDocumentFile[];
  isPrimaryVehicle: boolean;
}

export type VehicleMongoDocument = IVehicle & Document<Types.ObjectId>;

export interface SafeVehicle {
  id: string;
  ownerId: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  color?: string | null;
  insuranceExpiryDate?: string | null;
  pollutionExpiryDate?: string | null;
  serviceDueDate?: string | null;
  vehicleImages: string[];
  documents: VehicleDocumentFile[];
  isPrimaryVehicle: boolean;
  createdAt: Date;
  updatedAt: Date;
}
