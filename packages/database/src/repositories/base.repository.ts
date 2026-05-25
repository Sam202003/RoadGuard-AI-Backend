import type { Document, FilterQuery, Model, QueryOptions as MongooseQueryOptions } from 'mongoose';
import type { BaseEntity } from '../types/base-entity.js';
import { buildListQuery } from '../helpers/query.helper.js';
import {
  normalizePagination,
  toPaginatedResult,
  type PaginatedResult,
  type PaginationParams,
} from '../utils/pagination.util.js';

export abstract class BaseRepository<T extends BaseEntity & Document> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string, options?: MongooseQueryOptions): Promise<T | null> {
    return this.model.findById(id, null, options).exec();
  }

  async findOne(filter: FilterQuery<T>, options?: MongooseQueryOptions): Promise<T | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  async findPaginated(
    params: PaginationParams & {
      searchFields?: string[];
      baseFilter?: FilterQuery<T>;
    } = {},
  ): Promise<PaginatedResult<T>> {
    const { filter, pagination } = buildListQuery<T>(params);

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, pagination);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async restore(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true })
      .exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  protected normalizePagination(params: PaginationParams) {
    return normalizePagination(params);
  }
}
