import { NotificationChannel } from '../../constants/notification.enums.js';
import type { NotificationMongoDocument } from '../../interfaces/notification.interface.js';
import type {
  DeliveryResult,
  NotificationDeliveryProvider,
} from './notification-delivery.interface.js';

/** WhatsApp Business API — stub for future integration. */
export class WhatsAppDeliveryProvider implements NotificationDeliveryProvider {
  readonly channel = NotificationChannel.WHATSAPP;

  async deliver(_notification: NotificationMongoDocument): Promise<DeliveryResult> {
    return {
      channel: this.channel,
      success: false,
      error: 'WhatsApp delivery not configured (MVP)',
    };
  }
}
