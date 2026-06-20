import type {
  AiDiagnosisMongoDocument,
  SafeAiDiagnosis,
} from '../interfaces/ai.interface.js';

export function toSafeAiDiagnosis(doc: AiDiagnosisMongoDocument): SafeAiDiagnosis {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    vehicleId: doc.vehicleId?.toString() ?? null,
    userMessage: doc.userMessage,
    diagnosis: doc.diagnosis,
    model: doc.model,
    source: doc.source,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
