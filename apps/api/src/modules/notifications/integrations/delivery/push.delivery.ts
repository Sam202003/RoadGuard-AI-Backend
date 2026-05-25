import { NotificationChannel } from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type {
  DeliveryResult,
  NotificationDeliveryProvider,
} from './notification-delivery.interface.js';

/** Firebase / FCM push — stub for future integration. */
export class PushDeliveryProvider implements NotificationDeliveryProvider {
  readonly channel = NotificationChannel.PUSH;

  async deliver(_notification: NotificationMongoDocument): Promise<DeliveryResult> {
    return {
      channel: this.channel,
      success: false,
      error: 'Push delivery not configured (MVP)',
    };
  }
}
