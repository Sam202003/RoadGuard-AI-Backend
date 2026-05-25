import mongoose, { Schema, model, type Model } from 'mongoose';
import { createBaseSchema } from '@roadguard/database';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
  ProviderType,
} from '../constants/provider.enums.js';
import type { IProvider, ProviderMongoDocument } from '../interfaces/provider.interface.js';

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => Array.isArray(v) && v.length === 2,
        message: 'coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false },
);

const ratingsSchema = new Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const vehicleDetailsSchema = new Schema(
  {
    type: { type: String, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    registrationNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: false },
);

const documentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const bankDetailsSchema = new Schema(
  {
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    bankName: { type: String, trim: true },
  },
  { _id: false },
);

const providerDefinition = {
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  providerType: {
    type: String,
    enum: Object.values(ProviderType),
    required: true,
    index: true,
  },
  servicesOffered: { type: [String], default: [] },
  phoneNumber: { type: String, required: true, trim: true },
  alternatePhoneNumber: { type: String, trim: true, default: null },
  email: { type: String, required: true, lowercase: true, trim: true },
  profileImage: { type: String, default: null },
  currentLocation: { type: geoPointSchema, default: null },
  serviceRadius: { type: Number, default: 10, min: 1, max: 100 },
  availabilityStatus: {
    type: String,
    enum: Object.values(AvailabilityStatus),
    default: AvailabilityStatus.OFFLINE,
    index: true,
  },
  onlineStatus: {
    type: String,
    enum: Object.values(OnlineStatus),
    default: OnlineStatus.OFFLINE,
    index: true,
  },
  kycStatus: {
    type: String,
    enum: Object.values(KycStatus),
    default: KycStatus.PENDING,
    index: true,
  },
  ratings: { type: ratingsSchema, default: () => ({ average: 0, count: 0 }) },
  totalCompletedRequests: { type: Number, default: 0, min: 0 },
  vehicleDetails: { type: vehicleDetailsSchema, default: null },
  documents: { type: [documentSchema], default: [] },
  bankDetails: { type: bankDetailsSchema, default: null },
};

const providerSchema = createBaseSchema(providerDefinition);

providerSchema.index({ currentLocation: '2dsphere' });
providerSchema.index({ availabilityStatus: 1, onlineStatus: 1, kycStatus: 1 });
providerSchema.index({ providerType: 1, availabilityStatus: 1 });

export const ProviderModel: Model<ProviderMongoDocument> =
  (mongoose.models.Provider as Model<ProviderMongoDocument> | undefined) ??
  model<ProviderMongoDocument>('Provider', providerSchema);
