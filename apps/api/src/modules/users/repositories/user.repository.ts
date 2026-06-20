import { BaseRepository, type PaginatedResult, type PaginationParams } from '@roadguard/database';
import { UserModel } from '../schemas/user.schema.js';
import type { UserDocument } from '../interfaces/user.interface.js';

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  findByPhone(phoneNumber: string): Promise<UserDocument | null> {
    return this.model.findOne({ phoneNumber }).exec();
  }

  findActiveById(id: string): Promise<UserDocument | null> {
    return this.model.findOne({ _id: id, isActive: true }).exec();
  }

  findPaginatedAdmin(
    params: PaginationParams & { role?: string } = {},
  ): Promise<PaginatedResult<UserDocument>> {
    const baseFilter: Record<string, unknown> = {};
    if (params.role) {
      baseFilter.role = params.role;
    }

    return this.findPaginated({
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      search: params.search,
      baseFilter,
      searchFields: ['firstName', 'lastName', 'email', 'phoneNumber'],
    });
  }
}
