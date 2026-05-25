import type { Server } from 'socket.io';
import { getSocketIo, isRealtimeEnabled } from '../../../realtime/index.js';
import { RoomNames } from '../../../realtime/socket/rooms/room.names.js';
import type { SafeNotification } from '../interfaces/notification.interface.js';
import { NotificationSocketEvents } from './notification.events.js';

export class NotificationRealtimeGateway {
  private get io(): Server | null {
    if (!isRealtimeEnabled()) return null;
    try {
      return getSocketIo();
    } catch {
      return null;
    }
  }

  emitNew(notification: SafeNotification): void {
    const io = this.io;
    if (!io) return;

    const payload = { notification, timestamp: new Date().toISOString() };

    io.to(RoomNames.user(notification.userId)).emit(NotificationSocketEvents.NEW, payload);
    io.to(RoomNames.customer(notification.userId)).emit(NotificationSocketEvents.NEW, payload);
  }

  emitRead(userId: string, notificationId: string): void {
    const io = this.io;
    if (!io) return;

    const payload = {
      notificationId,
      userId,
      timestamp: new Date().toISOString(),
    };

    io.to(RoomNames.user(userId)).emit(NotificationSocketEvents.READ, payload);
  }

  emitCountUpdate(userId: string, unreadCount: number): void {
    const io = this.io;
    if (!io) return;

    const payload = {
      userId,
      unreadCount,
      timestamp: new Date().toISOString(),
    };

    io.to(RoomNames.user(userId)).emit(NotificationSocketEvents.COUNT_UPDATE, payload);
    io.to(RoomNames.customer(userId)).emit(NotificationSocketEvents.COUNT_UPDATE, payload);
  }

  /** Realtime-only broadcast to admin monitoring (e.g. emergency). */
  emitAdminAlert(notification: SafeNotification): void {
    const io = this.io;
    if (!io) return;

    io.to(RoomNames.adminMonitoring()).emit(NotificationSocketEvents.NEW, {
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  emitProviderRoom(providerId: string, notification: SafeNotification): void {
    const io = this.io;
    if (!io) return;

    io.to(RoomNames.provider(providerId)).emit(NotificationSocketEvents.NEW, {
      notification,
      timestamp: new Date().toISOString(),
    });
  }
}
