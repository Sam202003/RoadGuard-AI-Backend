import type { Env } from '@roadguard/config';
import type { Socket } from 'socket.io';
import { ServerEvents } from '../events/event.constants.js';

interface RateLimitState {
  count: number;
  windowStart: number;
}

const socketRateLimits = new Map<string, RateLimitState>();

export class SocketRateLimiter {
  constructor(
    private readonly maxEvents: number,
    private readonly windowMs: number,
  ) {}

  check(socket: Socket): boolean {
    const now = Date.now();
    let state = socketRateLimits.get(socket.id);

    if (!state || now - state.windowStart >= this.windowMs) {
      state = { count: 0, windowStart: now };
      socketRateLimits.set(socket.id, state);
    }

    state.count += 1;

    if (state.count > this.maxEvents) {
      socket.emit(ServerEvents.ERROR, {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many socket events. Please slow down.',
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    return true;
  }

  clear(socketId: string): void {
    socketRateLimits.delete(socketId);
  }
}

export function createRateLimiter(env: Env): SocketRateLimiter {
  return new SocketRateLimiter(
    env.SOCKET_MAX_EVENTS_PER_WINDOW,
    env.SOCKET_RATE_LIMIT_WINDOW_MS,
  );
}
