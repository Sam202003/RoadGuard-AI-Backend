import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../errors/index.js';
import { HTTP_STATUS } from '../constants/index.js';

export function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(
      `Validation failed for ${label}`,
      HTTP_STATUS.UNPROCESSABLE,
      formatZodErrors(result.error),
    );
  }

  return result.data;
}
