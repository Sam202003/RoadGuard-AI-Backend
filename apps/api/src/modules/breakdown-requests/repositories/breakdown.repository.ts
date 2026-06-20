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

  async aggregateStatusCounts(): Promise<Array<{ status: string; count: number }>> {
    return this.model
      .aggregate<{ status: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ])
      .exec();
  }

  async aggregateRequestsPerDay(days = 14): Promise<Array<{ date: string; count: number }>> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    since.setUTCHours(0, 0, 0, 0);

    return this.model
      .aggregate<{ date: string; count: number }>([
        { $match: { requestedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ])
      .exec();
  }
}
