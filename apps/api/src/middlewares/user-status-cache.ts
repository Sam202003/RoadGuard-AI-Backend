import type { UserRole } from '@roadguard/types';
import { getUserRepository } from '../modules/users/index.js';

interface CachedUserStatus {
  isActive: boolean;
  role: UserRole;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CachedUserStatus>();

export async function resolveActiveUser(
  userId: string,
  fallbackEmail: string,
  fallbackRole: UserRole,
): Promise<{ id: string; email: string; role: UserRole; isActive: boolean }> {
  const now = Date.now();
  const cached = cache.get(userId);

  if (cached && cached.expiresAt > now) {
    return {
      id: userId,
      email: fallbackEmail,
      role: cached.role,
      isActive: cached.isActive,
    };
  }

  const user = await getUserRepository().findById(userId);

  if (!user) {
    cache.delete(userId);
    return { id: userId, email: fallbackEmail, role: fallbackRole, isActive: false };
  }

  cache.set(userId, {
    isActive: user.isActive,
    role: user.role,
    expiresAt: now + CACHE_TTL_MS,
  });

  return {
    id: userId,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

export function invalidateUserStatusCache(userId: string): void {
  cache.delete(userId);
}
