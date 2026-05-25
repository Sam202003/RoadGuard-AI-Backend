import { NotificationChannel } from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type {
  DeliveryResult,
  NotificationDeliveryProvider,
} from './notification-delivery.interface.js';

/** Twilio SMS — stub for future integration. */
export class SmsDeliveryProvider implements NotificationDeliveryProvider {
  readonly channel = NotificationChannel.SMS;

  async deliver(_notification: NotificationMongoDocument): Promise<DeliveryResult> {
    return {
      channel: this.channel,
      success: false,
      error: 'SMS delivery not configured (MVP)',
    };
  }
}
