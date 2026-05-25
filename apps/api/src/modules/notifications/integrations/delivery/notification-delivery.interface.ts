import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type { NotificationChannel } from '../../constants/notification.enums.js';

export interface DeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  deliveredAt?: Date;
  error?: string;
}

export interface NotificationDeliveryProvider {
  readonly channel: NotificationChannel;
  deliver(notification: NotificationMongoDocument): Promise<DeliveryResult>;
}
