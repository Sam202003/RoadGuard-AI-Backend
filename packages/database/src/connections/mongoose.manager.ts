import mongoose from 'mongoose';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface MongoConnectOptions {
  uri: string;
  dbName?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  appName?: string;
}

let connectionState: ConnectionState = 'disconnected';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getMongoConnectionState(): ConnectionState {
  if (mongoose.connection.readyState === 1) return 'connected';
  if (mongoose.connection.readyState === 2) return 'connecting';
  if (mongoose.connection.readyState === 3) return 'disconnecting';
  return connectionState;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectMongo(options: MongoConnectOptions): Promise<typeof mongoose> {
  const { uri, dbName, maxRetries = 5, retryDelayMs = 3000, appName = 'roadguard' } = options;

  if (isMongoConnected()) {
    return mongoose;
  }

  connectionState = 'connecting';

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(uri, {
        dbName,
        appName,
        serverSelectionTimeoutMS: 10_000,
      });

      connectionState = 'connected';

      mongoose.connection.on('disconnected', () => {
        connectionState = 'disconnected';
      });

      mongoose.connection.on('reconnected', () => {
        connectionState = 'connected';
      });

      return mongoose;
    } catch (error) {
      lastError = error;
      connectionState = 'disconnected';

      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
      }
    }
  }

  connectionState = 'disconnected';
  throw lastError;
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    connectionState = 'disconnected';
    return;
  }

  connectionState = 'disconnecting';
  await mongoose.disconnect();
  connectionState = 'disconnected';
}

export async function pingMongo(): Promise<boolean> {
  if (!isMongoConnected()) return false;

  try {
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
