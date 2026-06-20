import mongoose, { Schema, model, type Model } from 'mongoose';
import { createBaseSchema } from '@roadguard/database';
import { DiagnosisSeverity, EmergencyLevel } from '../constants/ai.enums.js';
import { ProviderType } from '../../providers/constants/provider.enums.js';
import type {
  AiDiagnosisMongoDocument,
  IAiDiagnosis,
} from '../interfaces/ai.interface.js';

const diagnosisResultSchema = new Schema(
  {
    probableIssue: { type: String, required: true, trim: true, maxlength: 500 },
    severity: { type: String, enum: Object.values(DiagnosisSeverity), required: true },
    safeToDrive: { type: Boolean, required: true },
    emergencyLevel: { type: String, enum: Object.values(EmergencyLevel), required: true },
    recommendedProvider: { type: String, enum: Object.values(ProviderType), required: true },
    precautions: { type: [String], required: true, default: [] },
    temporaryAdvice: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false },
);

const aiDiagnosisDefinition = {
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null, index: true },
  userMessage: { type: String, required: true, trim: true, maxlength: 4000 },
  diagnosis: { type: diagnosisResultSchema, required: true },
  model: { type: String, required: true, trim: true, maxlength: 100 },
  source: { type: String, enum: ['openai', 'fallback'], required: true },
};

const aiDiagnosisSchema = createBaseSchema(aiDiagnosisDefinition);

aiDiagnosisSchema.index({ userId: 1, createdAt: -1 });

export const AiDiagnosisModel: Model<AiDiagnosisMongoDocument> =
  (mongoose.models.AiDiagnosis as Model<AiDiagnosisMongoDocument> | undefined) ??
  model<AiDiagnosisMongoDocument>('AiDiagnosis', aiDiagnosisSchema);

export type { IAiDiagnosis };
