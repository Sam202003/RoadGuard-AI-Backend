import type { FilterQuery } from 'mongoose';
import { buildSearchFilter, mergeFilters } from './filter.helper.js';
import type { PaginationParams } from '../utils/pagination.util.js';
import { normalizePagination } from '../utils/pagination.util.js';

export interface QueryOptions<T> extends PaginationParams {
  searchFields?: string[];
  baseFilter?: FilterQuery<T>;
}

export function buildListQuery<T>(options: QueryOptions<T> = {}) {
  const pagination = normalizePagination(options);
  const searchFilter = buildSearchFilter<T>(options.search, options.searchFields ?? []);
  const filter = mergeFilters<T>(
    mergeFilters<T>(options.baseFilter, options.filters),
    searchFilter as Record<string, unknown>,
  );

  return { filter, pagination };
}
