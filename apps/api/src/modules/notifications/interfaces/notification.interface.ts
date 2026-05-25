import type { Document, Types } from 'mongoose';
import type { BaseEntity } from '@roadguard/database';
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../constants/notification.enums.js';

export interface ChannelDeliveryLog {
  channel: NotificationChannel;
  status: NotificationStatus;
  attemptedAt: Date;
  deliveredAt?: Date | null;
  error?: string | null;
}

export interface INotification extends BaseEntity {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  readAt?: Date | null;
  deliveredAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  priority: NotificationPriority;
  deliveryLog: ChannelDeliveryLog[];
}

export type NotificationMongoDocument = INotification & Document<Types.ObjectId>;

export interface SafeNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  readAt?: string | null;
  deliveredAt?: string | null;
  createdBy?: string | null;
  priority: NotificationPriority;
  deliveryLog: Array<{
    channel: NotificationChannel;
    status: NotificationStatus;
    attemptedAt: string;
    deliveredAt?: string | null;
    error?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
