import mongoose, { Schema, Types, model, type Model } from 'mongoose';
import { createBaseSchema } from '@roadguard/database';
import {
  FuelType,
  TransmissionType,
  VehicleDocumentType,
  VehicleType,
} from '../constants/vehicle.enums.js';
import type { IVehicle, VehicleMongoDocument } from '../interfaces/vehicle.interface.js';

const vehicleDocumentFileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(VehicleDocumentType),
      default: VehicleDocumentType.OTHER,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const vehicleDefinition = {
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleType: {
    type: String,
    enum: Object.values(VehicleType),
    required: true,
  },
  brand: { type: String, required: true, trim: true },
  vehicleModel: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true },
  fuelType: {
    type: String,
    enum: Object.values(FuelType),
    required: true,
  },
  transmissionType: {
    type: String,
    enum: Object.values(TransmissionType),
    required: true,
  },
  color: { type: String, trim: true, default: null },
  insuranceExpiryDate: { type: Date, default: null },
  pollutionExpiryDate: { type: Date, default: null },
  serviceDueDate: { type: Date, default: null },
  vehicleImages: { type: [String], default: [] },
  documents: { type: [vehicleDocumentFileSchema], default: [] },
  isPrimaryVehicle: { type: Boolean, default: false },
};

const vehicleSchema = createBaseSchema(vehicleDefinition);

vehicleSchema.index({ ownerId: 1, registrationNumber: 1 }, { unique: true });
vehicleSchema.index({ ownerId: 1, isPrimaryVehicle: 1 });
vehicleSchema.index({ ownerId: 1, createdAt: -1 });

export const VehicleModel: Model<VehicleMongoDocument> =
  (mongoose.models.Vehicle as Model<VehicleMongoDocument> | undefined) ??
  model<VehicleMongoDocument>('Vehicle', vehicleSchema);

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
