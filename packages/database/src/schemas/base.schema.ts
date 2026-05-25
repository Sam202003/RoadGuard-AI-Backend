import { Schema, type SchemaDefinition, type SchemaOptions } from 'mongoose';
import { softDeletePlugin } from '../plugins/soft-delete.plugin.js';

export const BASE_SCHEMA_OPTIONS: SchemaOptions = {
  timestamps: true,
  versionKey: false,
};

export function createBaseSchema(
  definition: SchemaDefinition,
  options?: SchemaOptions,
): Schema {
  const schema = new Schema(definition, {
    ...BASE_SCHEMA_OPTIONS,
    ...options,
  });

  softDeletePlugin(schema);
  return schema;
}
