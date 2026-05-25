import type { SocketUserContext } from '../realtime/interfaces/socket.types.js';

declare module 'socket.io' {
  interface SocketData {
    user: SocketUserContext;
    connectedAt: string;
    lastHeartbeat: string;
  }
}
