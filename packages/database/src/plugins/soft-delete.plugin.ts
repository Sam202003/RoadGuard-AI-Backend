import type { Schema } from 'mongoose';

/**
 * Adds soft-delete fields and excludes deleted documents from find queries by default.
 * Pass `{ includeDeleted: true }` in query options to include deleted records.
 */
export function softDeletePlugin(schema: Schema): void {
  schema.add({
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  });

  schema.pre(/^find/, function () {
    const query = this as { getOptions: () => { includeDeleted?: boolean }; where: (f: object) => void };
    const options = query.getOptions();
    if (!options?.includeDeleted) {
      query.where({ isDeleted: { $ne: true } });
    }
  });
}
