import type { Document, Types } from 'mongoose';
import type { BaseEntity } from '@roadguard/database';
import type {
  DiagnosisSeverity,
  EmergencyLevel,
  RecommendedProviderType,
} from '../constants/ai.enums.js';
import type { AiDiagnosisResult } from '../validators/ai.validator.js';

export interface IAiDiagnosis extends BaseEntity {
  userId: Types.ObjectId;
  vehicleId?: Types.ObjectId | null;
  userMessage: string;
  diagnosis: AiDiagnosisResult;
  model: string;
  source: 'openai' | 'fallback';
}

export type AiDiagnosisMongoDocument = IAiDiagnosis & Document<Types.ObjectId>;

export interface SafeAiDiagnosis {
  id: string;
  userId: string;
  vehicleId?: string | null;
  userMessage: string;
  diagnosis: AiDiagnosisResult;
  model: string;
  source: 'openai' | 'fallback';
  createdAt: Date;
  updatedAt: Date;
}
