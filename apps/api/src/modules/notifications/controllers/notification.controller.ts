import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getNotificationService } from '../index.js';
import type {
  ListNotificationsQuery,
  NotificationIdParams,
} from '../validators/notification.validator.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListNotificationsQuery;
  const { notifications, meta } = await getNotificationService().listForUser(
    req.user!.id,
    query,
  );

  sendSuccess(res, {
    message: 'Notifications fetched successfully',
    data: { notifications },
    meta,
  });
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const unreadCount = await getNotificationService().getUnreadCount(req.user!.id);

  sendSuccess(res, {
    message: 'Unread count fetched successfully',
    data: { unreadCount },
  });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params as NotificationIdParams;
  const notification = await getNotificationService().markAsRead(req.user!.id, id);

  sendSuccess(res, {
    message: 'Notification marked as read',
    data: { notification },
  });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  const result = await getNotificationService().markAllAsRead(req.user!.id);

  sendSuccess(res, {
    message: 'All notifications marked as read',
    data: result,
  });
}
