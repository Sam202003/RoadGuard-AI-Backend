import { BaseRepository } from '@roadguard/database';
import type { AiDiagnosisMongoDocument } from '../interfaces/ai.interface.js';
import { AiDiagnosisModel } from '../schemas/ai-diagnosis.schema.js';

export class AiDiagnosisRepository extends BaseRepository<AiDiagnosisMongoDocument> {
  constructor() {
    super(AiDiagnosisModel);
  }

  async findByUserIdPaginated(
    userId: string,
    params: { page?: number; limit?: number; sort?: string } = {},
  ) {
    return this.findPaginated({
      page: params.page,
      limit: params.limit,
      sort: params.sort ?? '-createdAt',
      baseFilter: { userId },
    });
  }
}
