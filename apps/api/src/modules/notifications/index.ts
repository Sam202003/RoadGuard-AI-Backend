import { BreakdownNotificationsIntegration } from './integrations/breakdown-notifications.integration.js';
import { NotificationDeliveryOrchestrator } from './integrations/delivery/delivery.orchestrator.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { NotificationRealtimeGateway } from './realtime/notification-realtime.gateway.js';
import { NotificationService } from './services/notification.service.js';

let notificationRepository: NotificationRepository | null = null;
let notificationService: NotificationService | null = null;
let breakdownNotificationsIntegration: BreakdownNotificationsIntegration | null = null;

export function initNotificationsModule(): void {
  notificationRepository = new NotificationRepository();
  const deliveryOrchestrator = new NotificationDeliveryOrchestrator();
  const realtimeGateway = new NotificationRealtimeGateway();
  notificationService = new NotificationService(
    notificationRepository,
    deliveryOrchestrator,
    realtimeGateway,
  );
  breakdownNotificationsIntegration = new BreakdownNotificationsIntegration(
    notificationService,
  );
}

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    throw new Error('Notifications module not initialized');
  }
  return notificationService;
}

export function getBreakdownNotificationsIntegration(): BreakdownNotificationsIntegration {
  if (!breakdownNotificationsIntegration) {
    throw new Error('Notifications module not initialized');
  }
  return breakdownNotificationsIntegration;
}

export { notificationRouter } from './routes/notification.routes.js';
export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
} from './constants/notification.enums.js';
export type { SafeNotification } from './interfaces/notification.interface.js';
export { NotificationSocketEvents } from './realtime/notification.events.js';
