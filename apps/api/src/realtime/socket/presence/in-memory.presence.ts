import type { PresenceSession, PresenceStore } from './presence.store.js';

export class InMemoryPresenceStore implements PresenceStore {
  private readonly sessions = new Map<string, PresenceSession>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly providerOnline = new Map<string, boolean>();

  addSession(session: PresenceSession): void {
    this.sessions.set(session.socketId, session);

    let sockets = this.userSockets.get(session.userId);
    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(session.userId, sockets);
    }
    sockets.add(session.socketId);

    if (session.providerId) {
      this.providerOnline.set(session.providerId, true);
    }
  }

  removeSession(socketId: string): PresenceSession | undefined {
    const session = this.sessions.get(socketId);
    if (!session) return undefined;

    this.sessions.delete(socketId);

    const sockets = this.userSockets.get(session.userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(session.userId);
        if (session.providerId) {
          this.providerOnline.set(session.providerId, false);
        }
      }
    }

    return session;
  }

  updateHeartbeat(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.lastHeartbeat = new Date();
    }
  }

  getSession(socketId: string): PresenceSession | undefined {
    return this.sessions.get(socketId);
  }

  getSessionsByUserId(userId: string): PresenceSession[] {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return [];
    return [...socketIds]
      .map((id) => this.sessions.get(id))
      .filter((s): s is PresenceSession => s !== undefined);
  }

  getOnlineProviderIds(): string[] {
    return [...this.providerOnline.entries()]
      .filter(([, online]) => online)
      .map(([id]) => id);
  }

  getOnlineCustomerIds(): string[] {
    const customerIds = new Set<string>();
    for (const session of this.sessions.values()) {
      if (session.role === 'CUSTOMER') {
        customerIds.add(session.userId);
      }
    }
    return [...customerIds];
  }

  setProviderOnline(providerId: string, online: boolean): void {
    this.providerOnline.set(providerId, online);
  }

  isProviderOnline(providerId: string): boolean {
    return this.providerOnline.get(providerId) ?? false;
  }

  getStaleSessions(maxIdleMs: number): PresenceSession[] {
    const cutoff = Date.now() - maxIdleMs;
    return [...this.sessions.values()].filter(
      (s) => s.lastHeartbeat.getTime() < cutoff,
    );
  }

  size(): number {
    return this.sessions.size;
  }
}
