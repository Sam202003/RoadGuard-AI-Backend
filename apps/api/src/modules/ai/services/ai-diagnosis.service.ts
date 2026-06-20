import { Types } from 'mongoose';
import type { Env } from '@roadguard/config';
import { AppError } from '../../../errors/index.js';
import { getVehicleService } from '../../vehicles/index.js';
import type { SafeAiDiagnosis } from '../interfaces/ai.interface.js';
import { AiDiagnosisRepository } from '../repositories/ai-diagnosis.repository.js';
import { AiDiagnosisModel } from '../schemas/ai-diagnosis.schema.js';
import { generateDiagnosis } from './openai-diagnosis.service.js';
import { toSafeAiDiagnosis } from '../utils/ai.mapper.js';
import type {
  DiagnoseBody,
  ListDiagnosisHistoryQuery,
} from '../validators/ai.validator.js';

export class AiDiagnosisService {
  constructor(
    private readonly repository: AiDiagnosisRepository,
    private readonly env: Env,
  ) {}

  private async validateVehicleOwnership(userId: string, vehicleId?: string): Promise<void> {
    if (!vehicleId) return;

    const vehicle = await getVehicleService().getVehicleById(userId, vehicleId);
    if (!vehicle) {
      throw AppError.notFound('Vehicle not found');
    }
  }

  async diagnose(userId: string, body: DiagnoseBody): Promise<SafeAiDiagnosis> {
    await this.validateVehicleOwnership(userId, body.vehicleId);

    const { diagnosis, model, source } = await generateDiagnosis(this.env, body);

    const doc = await AiDiagnosisModel.create({
      userId: new Types.ObjectId(userId),
      vehicleId: body.vehicleId ? new Types.ObjectId(body.vehicleId) : null,
      userMessage: body.message,
      diagnosis,
      model,
      source,
    });

    return toSafeAiDiagnosis(doc);
  }

  async listHistory(userId: string, query: ListDiagnosisHistoryQuery) {
    const result = await this.repository.findByUserIdPaginated(userId, {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

    return {
      diagnoses: result.data.map(toSafeAiDiagnosis),
      meta: result.meta,
    };
  }

  async getById(userId: string, id: string): Promise<SafeAiDiagnosis> {
    const doc = await this.repository.findById(id);
    if (!doc || doc.userId.toString() !== userId) {
      throw AppError.notFound('Diagnosis not found');
    }
    return toSafeAiDiagnosis(doc);
  }
}
