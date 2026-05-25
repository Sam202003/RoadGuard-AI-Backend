import type { Env } from '@roadguard/config';
import type { ExtendedError, Socket } from 'socket.io';
import { UserRole } from '@roadguard/types';
import { verifyAccessToken } from '../../../modules/auth/utils/token.util.js';
import { getProviderRepository } from '../../../modules/providers/index.js';
import type { SocketUserContext } from '../../interfaces/socket.types.js';

function extractToken(socket: Socket): string | undefined {
  const auth = socket.handshake.auth as { token?: string } | undefined;
  if (auth?.token) return auth.token;

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return undefined;
}

export function createSocketAuthMiddleware(env: Env) {
  return async (socket: Socket, next: (err?: ExtendedError) => void): Promise<void> => {
    try {
      const token = extractToken(socket);

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const payload = verifyAccessToken(env, token);

      const user: SocketUserContext = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      if (payload.role === UserRole.PROVIDER) {
        const provider = await getProviderRepository().findByUserId(payload.sub);
        if (provider) {
          user.providerId = provider._id.toString();
        }
      }

      const now = new Date().toISOString();
      socket.data.user = user;
      socket.data.connectedAt = now;
      socket.data.lastHeartbeat = now;
      next();
    } catch {
      next(new Error('Invalid or expired access token'));
    }
  };
}
