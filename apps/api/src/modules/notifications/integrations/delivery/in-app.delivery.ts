import { NotificationChannel } from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type {
  DeliveryResult,
  NotificationDeliveryProvider,
} from './notification-delivery.interface.js';

/** MVP: in-app delivery is fulfilled by persistence + Socket.IO emit. */
export class InAppDeliveryProvider implements NotificationDeliveryProvider {
  readonly channel = NotificationChannel.IN_APP;

  async deliver(_notification: NotificationMongoDocument): Promise<DeliveryResult> {
    const now = new Date();
    return {
      channel: this.channel,
      success: true,
      deliveredAt: now,
    };
  }
}
