import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { envSchema, type Env } from './env.schema.js';

let cached: Env | null = null;

/**
 * Load and validate environment variables.
 * Looks for .env in cwd, then monorepo root (apps/api → ../../.env).
 */
export function loadEnv(options?: { envPath?: string }): Env {
  if (cached && !options?.envPath) {
    return cached;
  }

  const candidates = [
    options?.envPath,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../../../.env'),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    loadDotenv({ path: file, override: false });
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(message)}`);
  }

  cached = parsed.data;
  return parsed.data;
}

export function resetEnvCache(): void {
  cached = null;
}
