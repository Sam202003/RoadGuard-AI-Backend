import mongoose, { Schema, model, type Model } from 'mongoose';
import { createBaseSchema } from '@roadguard/database';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../constants/notification.enums.js';
import type {
  INotification,
  NotificationMongoDocument,
} from '../interfaces/notification.interface.js';

const deliveryLogSchema = new Schema(
  {
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    status: { type: String, enum: Object.values(NotificationStatus), required: true },
    attemptedAt: { type: Date, required: true, default: Date.now },
    deliveredAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { _id: false },
);

const notificationDefinition = {
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  },
  channels: {
    type: [{ type: String, enum: Object.values(NotificationChannel) }],
    default: [NotificationChannel.IN_APP],
  },
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    index: true,
  },
  deliveryLog: { type: [deliveryLogSchema], default: [] },
};

const notificationSchema = createBaseSchema(notificationDefinition);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationMongoDocument> =
  (mongoose.models.Notification as Model<NotificationMongoDocument> | undefined) ??
  model<NotificationMongoDocument>('Notification', notificationSchema);

export type { INotification };
