import type { Env } from '@roadguard/config';
import { AiDiagnosisRepository } from './repositories/ai-diagnosis.repository.js';
import { AiDiagnosisService } from './services/ai-diagnosis.service.js';

let aiDiagnosisRepository: AiDiagnosisRepository | null = null;
let aiDiagnosisService: AiDiagnosisService | null = null;

export function initAiModule(env: Env): void {
  aiDiagnosisRepository = new AiDiagnosisRepository();
  aiDiagnosisService = new AiDiagnosisService(aiDiagnosisRepository, env);
}

export function getAiDiagnosisService(): AiDiagnosisService {
  if (!aiDiagnosisService) {
    throw new Error('AI module not initialized');
  }
  return aiDiagnosisService;
}

export { aiRouter } from './routes/ai.routes.js';
export {
  DiagnosisSeverity,
  EmergencyLevel,
} from './constants/ai.enums.js';
export type { SafeAiDiagnosis } from './interfaces/ai.interface.js';
export type { AiDiagnosisResult } from './validators/ai.validator.js';
