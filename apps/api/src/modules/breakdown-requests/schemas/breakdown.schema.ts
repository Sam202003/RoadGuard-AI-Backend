import mongoose, { Schema, model, type Model } from 'mongoose';
import { createBaseSchema } from '@roadguard/database';
import {
  BreakdownStatus,
  IssueType,
  RequestPriority,
} from '../constants/breakdown.enums.js';
import type {
  BreakdownMongoDocument,
  IBreakdownRequest,
} from '../interfaces/breakdown.interface.js';

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

const breakdownDefinition = {
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  assignedProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'Provider',
    default: null,
    index: true,
  },
  issueType: {
    type: String,
    enum: Object.values(IssueType),
    required: true,
    index: true,
  },
  issueDescription: { type: String, required: true, trim: true, maxlength: 2000 },
  images: { type: [String], default: [] },
  priority: {
    type: String,
    enum: Object.values(RequestPriority),
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(BreakdownStatus),
    default: BreakdownStatus.CREATED,
    index: true,
  },
  location: { type: geoPointSchema, required: true },
  requestedAt: { type: Date, required: true, default: Date.now },
  assignedAt: { type: Date, default: null },
  arrivedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  estimatedArrivalTime: { type: Number, default: null, min: 0 },
  estimatedDistance: { type: Number, default: null, min: 0 },
  serviceCost: { type: Number, default: null, min: 0 },
  cancellationReason: { type: String, default: null, trim: true, maxlength: 500 },
  aiDiagnosisSummary: { type: String, default: null, trim: true, maxlength: 2000 },
  notes: { type: String, default: null, trim: true, maxlength: 1000 },
  trackingEnabled: { type: Boolean, default: true },
};

const breakdownSchema = createBaseSchema(breakdownDefinition);

breakdownSchema.index({ location: '2dsphere' });
breakdownSchema.index({ customerId: 1, status: 1, createdAt: -1 });
breakdownSchema.index({ assignedProviderId: 1, status: 1, createdAt: -1 });
breakdownSchema.index({ priority: 1, status: 1 });

export const BreakdownRequestModel: Model<BreakdownMongoDocument> =
  (mongoose.models.BreakdownRequest as Model<BreakdownMongoDocument> | undefined) ??
  model<BreakdownMongoDocument>('BreakdownRequest', breakdownSchema);
