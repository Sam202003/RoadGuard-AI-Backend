import type { Env } from '@roadguard/config';
import { createApp } from './app.js';
import {
  connectInfrastructure,
  createHttpServer,
  disconnectInfrastructure,
  startListening,
} from './core/index.js';
import { initRealtime, shutdownRealtime } from './realtime/index.js';

/**
 * Bootstrap: infrastructure → Express → HTTP server → listen.
 */
export async function bootstrap(env: Env): Promise<void> {
  await connectInfrastructure(env);

  const app = createApp(env);
  const server = createHttpServer(app, env, {
    onShutdown: async () => {
      await shutdownRealtime();
      await disconnectInfrastructure();
    },
  });

  await initRealtime(env, server);
  await startListening(server, env.PORT, env.APP_NAME);
}
