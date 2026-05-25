import { NotificationChannel } from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type {
  DeliveryResult,
  NotificationDeliveryProvider,
} from './notification-delivery.interface.js';

/** Email provider (SendGrid, SES, etc.) — stub for future integration. */
export class EmailDeliveryProvider implements NotificationDeliveryProvider {
  readonly channel = NotificationChannel.EMAIL;

  async deliver(_notification: NotificationMongoDocument): Promise<DeliveryResult> {
    return {
      channel: this.channel,
      success: false,
      error: 'Email delivery not configured (MVP)',
    };
  }
}
