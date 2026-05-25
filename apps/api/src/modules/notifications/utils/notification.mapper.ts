import type {
  NotificationMongoDocument,
  SafeNotification,
} from '../interfaces/notification.interface.js';

export function toSafeNotification(doc: NotificationMongoDocument): SafeNotification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    channels: doc.channels,
    status: doc.status,
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    readAt: doc.readAt?.toISOString() ?? null,
    deliveredAt: doc.deliveredAt?.toISOString() ?? null,
    createdBy: doc.createdBy?.toString() ?? null,
    priority: doc.priority,
    deliveryLog: (doc.deliveryLog ?? []).map((entry) => ({
      channel: entry.channel,
      status: entry.status,
      attemptedAt: entry.attemptedAt.toISOString(),
      deliveredAt: entry.deliveredAt?.toISOString() ?? null,
      error: entry.error ?? null,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
