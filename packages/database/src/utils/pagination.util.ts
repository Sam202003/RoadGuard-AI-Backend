export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function normalizePagination(params: PaginationParams = {}): NormalizedPagination {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  let sort: Record<string, 1 | -1> = { createdAt: -1 };

  if (params.sort) {
    const [field, direction] = params.sort.split(':');
    if (field) {
      sort = { [field]: direction === 'asc' ? 1 : -1 };
    }
  }

  return { page, limit, skip, sort };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  pagination: NormalizedPagination,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}
