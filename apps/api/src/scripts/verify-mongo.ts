/**
 * Prints which MongoDB you are connected to and lists databases/collections.
 * Run: pnpm --filter @roadguard/api verify:mongo
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config as loadDotenv } from 'dotenv';
import { loadEnv, resetEnvCache } from '@roadguard/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  loadDotenv({ path: path.resolve(__dirname, '../../.env') });
  resetEnvCache();
  const env = loadEnv({ envPath: path.resolve(__dirname, '../../.env') });

  const masked = env.MONGODB_URI.replace(/:([^:@/]+)@/, ':****@');
  console.log('\n=== Road Guard MongoDB check ===\n');
  console.log('MONGODB_URI:', masked);
  console.log('MONGODB_DB_NAME:', env.MONGODB_DB_NAME);

  if (/localhost|127\.0\.0\.1/i.test(env.MONGODB_URI)) {
    console.log('\n❌ This is LOCAL Mongo — Atlas/Compass (cloud) will stay empty.\n');
  } else if (/mongodb\+srv/i.test(env.MONGODB_URI)) {
    console.log('\n✓ This looks like MongoDB Atlas (cloud).\n');
  }

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  const admin = mongoose.connection.db?.admin();
  const { databases } = (await admin?.listDatabases()) ?? { databases: [] };

  console.log('Databases on this server:');
  for (const db of databases) {
    console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024).toFixed(1)} KB)`);
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error('No database handle');

  const collections = await db.listCollections().toArray();
  console.log(`\nCollections in "${env.MONGODB_DB_NAME}":`);
  if (collections.length === 0) {
    console.log('  (none — run: pnpm seed:demo -- --reset)');
  } else {
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  - ${c.name}: ${count} documents`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
