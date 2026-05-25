export {
  connectMongo,
  disconnectMongo,
  getMongoConnectionState,
  isMongoConnected,
  pingMongo,
  type ConnectionState,
  type MongoConnectOptions,
} from './connections/mongoose.manager.js';

export { createBaseSchema, BASE_SCHEMA_OPTIONS } from './schemas/base.schema.js';
export { softDeletePlugin } from './plugins/soft-delete.plugin.js';
export { BaseRepository } from './repositories/base.repository.js';
export type { BaseEntity } from './types/base-entity.js';

export {
  normalizePagination,
  buildPaginationMeta,
  toPaginatedResult,
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResult,
  type NormalizedPagination,
} from './utils/pagination.util.js';

export { mergeFilters, buildSearchFilter } from './helpers/filter.helper.js';
export { buildListQuery, type QueryOptions } from './helpers/query.helper.js';
