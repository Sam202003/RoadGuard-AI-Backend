import type { UserRole } from '@roadguard/types';

export interface PresenceSession {
  socketId: string;
  userId: string;
  role: UserRole;
  providerId?: string;
  connectedAt: Date;
  lastHeartbeat: Date;
}

export interface PresenceStore {
  addSession(session: PresenceSession): void;
  removeSession(socketId: string): PresenceSession | undefined;
  updateHeartbeat(socketId: string): void;
  getSession(socketId: string): PresenceSession | undefined;
  getSessionsByUserId(userId: string): PresenceSession[];
  getOnlineProviderIds(): string[];
  getOnlineCustomerIds(): string[];
  setProviderOnline(providerId: string, online: boolean): void;
  isProviderOnline(providerId: string): boolean;
  getStaleSessions(maxIdleMs: number): PresenceSession[];
  size(): number;
}
