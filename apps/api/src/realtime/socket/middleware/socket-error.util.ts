import type { Socket } from 'socket.io';
import { ServerEvents } from '../events/event.constants.js';

export function emitSocketError(
  socket: Socket,
  code: string,
  message: string,
): void {
  socket.emit(ServerEvents.ERROR, {
    code,
    message,
    timestamp: new Date().toISOString(),
  });
}
