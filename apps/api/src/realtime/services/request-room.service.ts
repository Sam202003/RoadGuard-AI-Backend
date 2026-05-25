import type { Socket } from 'socket.io';
import { getBreakdownRequestService } from '../../modules/breakdown-requests/index.js';
import { RoomNames } from '../socket/rooms/room.names.js';
import { emitSocketError } from '../socket/middleware/socket-error.util.js';
import type { SocketData } from 'socket.io';

export class RequestRoomService {
  async joinRequestRoom(socket: Socket, requestId: string): Promise<boolean> {
    const data = socket.data as SocketData;

    try {
      await getBreakdownRequestService().getRequestById(
        { id: data.user.id, role: data.user.role },
        requestId,
      );
      socket.join(RoomNames.request(requestId));
      return true;
    } catch {
      emitSocketError(socket, 'REQUEST_ACCESS_DENIED', 'Cannot join this request room');
      return false;
    }
  }

  leaveRequestRoom(socket: Socket, requestId: string): void {
    socket.leave(RoomNames.request(requestId));
  }
}
