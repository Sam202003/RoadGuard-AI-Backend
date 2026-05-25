import { Types } from 'mongoose';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type { NotificationDeliveryProvider } from './notification-delivery.interface.js';
import { InAppDeliveryProvider } from './in-app.delivery.js';
import { PushDeliveryProvider } from './push.delivery.js';
import { EmailDeliveryProvider } from './email.delivery.js';
import { SmsDeliveryProvider } from './sms.delivery.js';
import { WhatsAppDeliveryProvider } from './whatsapp.delivery.js';

export class NotificationDeliveryOrchestrator {
  private readonly providers: Map<NotificationChannel, NotificationDeliveryProvider>;

  constructor() {
    const providers: Array<[NotificationChannel, NotificationDeliveryProvider]> = [
      [NotificationChannel.IN_APP, new InAppDeliveryProvider()],
      [NotificationChannel.PUSH, new PushDeliveryProvider()],
      [NotificationChannel.EMAIL, new EmailDeliveryProvider()],
      [NotificationChannel.SMS, new SmsDeliveryProvider()],
      [NotificationChannel.WHATSAPP, new WhatsAppDeliveryProvider()],
    ];
    this.providers = new Map(providers);
  }

  async deliver(notification: NotificationMongoDocument): Promise<void> {
    const now = new Date();
    let anySuccess = false;

    for (const channel of notification.channels) {
      const provider = this.providers.get(channel);

      if (!provider) {
        notification.deliveryLog.push({
          channel,
          status: NotificationStatus.FAILED,
          attemptedAt: now,
          deliveredAt: null,
          error: `No provider for channel ${channel}`,
        });
        continue;
      }

      const result = await provider.deliver(notification);

      notification.deliveryLog.push({
        channel: result.channel,
        status: result.success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
        attemptedAt: now,
        deliveredAt: result.deliveredAt ?? null,
        error: result.error ?? null,
      });

      if (result.success) {
        anySuccess = true;
        if (channel === NotificationChannel.IN_APP) {
          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = result.deliveredAt ?? now;
        }
      }
    }

    if (!anySuccess && notification.status === NotificationStatus.PENDING) {
      notification.status = NotificationStatus.FAILED;
    } else if (notification.status === NotificationStatus.PENDING && anySuccess) {
      notification.status = NotificationStatus.SENT;
    }

    await notification.save();
  }
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: import('../../constants/notification.enums.js').NotificationType;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  priority?: import('../../constants/notification.enums.js').NotificationPriority;
}

export function buildNotificationDocument(
  input: CreateNotificationInput,
): Partial<NotificationMongoDocument> {
  return {
    userId: new Types.ObjectId(input.userId),
    title: input.title,
    message: input.message,
    type: input.type,
    channels: input.channels ?? [NotificationChannel.IN_APP],
    status: NotificationStatus.PENDING,
    metadata: input.metadata ?? {},
    createdBy: input.createdBy ? new Types.ObjectId(input.createdBy) : null,
    priority: input.priority ?? NotificationPriority.MEDIUM,
    deliveryLog: [],
  };
}
