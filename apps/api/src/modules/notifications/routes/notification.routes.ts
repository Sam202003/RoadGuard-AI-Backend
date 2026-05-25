import { Router, type IRouter } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../validators/notification.validator.js';

export const notificationRouter: IRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  asyncHandler(listNotifications),
);

notificationRouter.get('/unread-count', asyncHandler(getUnreadCount));

notificationRouter.patch(
  '/read-all',
  asyncHandler(markAllNotificationsRead),
);

notificationRouter.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  asyncHandler(markNotificationRead),
);
