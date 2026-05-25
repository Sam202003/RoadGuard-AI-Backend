import { loadEnv } from '@roadguard/config';
import { bootstrap } from './server.js';

async function main(): Promise<void> {
  const env = loadEnv();
  await bootstrap(env);
}

main().catch((error: unknown) => {
  console.error('[roadguard] fatal startup error:', error);
  process.exit(1);
});
