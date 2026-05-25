import { AppError } from '../../../errors/index.js';
import {
  NotificationChannel,
  NotificationPriority,
} from '../constants/notification.enums.js';
import { NotificationType } from '../constants/notification.enums.js';
import type { SafeNotification } from '../interfaces/notification.interface.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import {
  buildNotificationDocument,
  NotificationDeliveryOrchestrator,
  type CreateNotificationInput,
} from '../integrations/delivery/delivery.orchestrator.js';
import { NotificationRealtimeGateway } from '../realtime/notification-realtime.gateway.js';
import { toSafeNotification } from '../utils/notification.mapper.js';
import type { ListNotificationsQuery } from '../validators/notification.validator.js';

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly deliveryOrchestrator: NotificationDeliveryOrchestrator,
    private readonly realtimeGateway: NotificationRealtimeGateway,
  ) {}

  async send(input: CreateNotificationInput): Promise<SafeNotification> {
    const doc = await this.repository.create(
      buildNotificationDocument({
        ...input,
        priority: input.priority ?? NotificationPriority.MEDIUM,
        channels: input.channels ?? [NotificationChannel.IN_APP],
      }),
    );

    await this.deliveryOrchestrator.deliver(doc);

    const refreshed = (await this.repository.findById(doc._id.toString()))!;
    const safe = toSafeNotification(refreshed);

    this.realtimeGateway.emitNew(safe);
    await this.emitUnreadCount(input.userId);

    return safe;
  }

  async listForUser(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<{ notifications: SafeNotification[]; meta: Record<string, unknown> }> {
    const result = await this.repository.findByUserPaginated(userId, {
      page: query.page,
      limit: query.limit,
      sort: query.sort ?? '-createdAt',
      unreadOnly: query.unreadOnly,
      type: query.type,
    });

    return {
      notifications: result.data.map(toSafeNotification),
      meta: result.meta as unknown as Record<string, unknown>,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<SafeNotification> {
    const updated = await this.repository.markAsRead(notificationId, userId);

    if (!updated) {
      const existing = await this.repository.findByIdAndUser(notificationId, userId);
      if (!existing) {
        throw AppError.notFound('Notification not found');
      }
      return toSafeNotification(existing);
    }

    const safe = toSafeNotification(updated);
    this.realtimeGateway.emitRead(userId, notificationId);
    await this.emitUnreadCount(userId);
    return safe;
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await this.repository.markAllAsRead(userId);
    await this.emitUnreadCount(userId);
    return { updatedCount };
  }

  async emitUnreadCount(userId: string): Promise<void> {
    const unreadCount = await this.getUnreadCount(userId);
    this.realtimeGateway.emitCountUpdate(userId, unreadCount);
  }

  emitToProviderRoom(providerId: string, notification: SafeNotification): void {
    this.realtimeGateway.emitProviderRoom(providerId, notification);
  }

  emitAdminAlert(notification: SafeNotification): void {
    this.realtimeGateway.emitAdminAlert(notification);
  }

  async notifyProviderOnlineStatus(
    providerUserId: string,
    providerId: string,
    online: boolean,
  ): Promise<void> {
    await this.send({
      userId: providerUserId,
      title: online ? 'You are online' : 'You are offline',
      message: online
        ? 'You are now visible for breakdown assignments.'
        : 'You are no longer receiving live assignments.',
      type: NotificationType.SYSTEM_NOTIFICATION,
      metadata: { providerId, online },
      priority: NotificationPriority.LOW,
    });
  }
}

export type { CreateNotificationInput };
