import { Types } from 'mongoose';
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationParams,
} from '@roadguard/database';
import { BreakdownRequestModel } from '../schemas/breakdown.schema.js';
import type { BreakdownMongoDocument } from '../interfaces/breakdown.interface.js';

export class BreakdownRequestRepository extends BaseRepository<BreakdownMongoDocument> {
  constructor() {
    super(BreakdownRequestModel);
  }

  findByCustomerPaginated(
    customerId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<BreakdownMongoDocument>> {
    return this.findPaginated({
      ...params,
      baseFilter: { customerId: new Types.ObjectId(customerId) },
      searchFields: ['issueDescription', 'notes'],
    });
  }

  findByAssignedProviderPaginated(
    providerId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<BreakdownMongoDocument>> {
    return this.findPaginated({
      ...params,
      baseFilter: { assignedProviderId: new Types.ObjectId(providerId) },
      searchFields: ['issueDescription', 'notes'],
    });
  }

  findAllPaginated(
    params: PaginationParams = {},
  ): Promise<PaginatedResult<BreakdownMongoDocument>> {
    return this.findPaginated({
      ...params,
      searchFields: ['issueDescription', 'notes'],
    });
  }
}
