import type { Env } from '@roadguard/config';
import { initUsersModule } from '../users/index.js';
import { AuthService } from './services/auth.service.js';

let authService: AuthService | null = null;

export function initAuthModule(env: Env): void {
  initUsersModule();
  authService = new AuthService(env);
}

export function getAuthService(): AuthService {
  if (!authService) {
    throw new Error('Auth module not initialized');
  }
  return authService;
}

export { authRouter } from './routes/auth.routes.js';
export type { AuthenticatedUser, AuthTokens, JwtPayload } from './interfaces/auth.interface.js';
