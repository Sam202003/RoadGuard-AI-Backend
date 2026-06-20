/**
 * One-time migration: encrypt existing plaintext provider bank details.
 *
 * Usage:
 *   FIELD_ENCRYPTION_KEY=<base64-32-byte-key> pnpm --filter @roadguard/api migrate:encrypt-bank
 */
import { loadEnv } from '@roadguard/config';
import { connectInfrastructure, disconnectInfrastructure } from '../core/infrastructure.js';
import { getProviderService } from '../modules/providers/index.js';

async function main(): Promise<void> {
  const env = loadEnv();
  await connectInfrastructure(env);

  const result = await getProviderService().migratePlaintextBankDetails();
  console.info(`Encrypted bank details for ${result.updated} provider(s).`);

  await disconnectInfrastructure();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
