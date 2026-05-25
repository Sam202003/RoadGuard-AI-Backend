import type { FilterQuery } from 'mongoose';

export function mergeFilters<T>(
  base: FilterQuery<T> = {},
  filters?: Record<string, unknown>,
): FilterQuery<T> {
  if (!filters || Object.keys(filters).length === 0) {
    return base;
  }

  return { ...base, ...filters } as FilterQuery<T>;
}

export function buildSearchFilter<T>(
  search: string | undefined,
  fields: string[],
): FilterQuery<T> | Record<string, never> {
  if (!search?.trim() || fields.length === 0) {
    return {};
  }

  const regex = new RegExp(search.trim(), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  } as FilterQuery<T>;
}
