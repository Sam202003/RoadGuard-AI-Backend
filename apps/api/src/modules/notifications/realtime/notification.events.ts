/** Server → Client notification events */
export const NotificationSocketEvents = {
  NEW: 'notification:new',
  READ: 'notification:read',
  COUNT_UPDATE: 'notification:count:update',
} as const;
