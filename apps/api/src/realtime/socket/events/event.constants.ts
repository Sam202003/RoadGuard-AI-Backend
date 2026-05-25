/** Client → Server */
export const ClientEvents = {
  AUTH_CONNECT: 'auth:connect',
  PROVIDER_LOCATION_UPDATE: 'provider:location:update',
  REQUEST_JOIN: 'request:join',
  REQUEST_LEAVE: 'request:leave',
  PROVIDER_ONLINE: 'provider:online',
  PROVIDER_OFFLINE: 'provider:offline',
  HEARTBEAT: 'heartbeat',
} as const;

/** Server → Client */
export const ServerEvents = {
  REQUEST_STATUS_UPDATED: 'request:status:updated',
  PROVIDER_LOCATION_UPDATED: 'provider:location:updated',
  TRACKING_ETA_UPDATED: 'tracking:eta:updated',
  PROVIDER_ASSIGNED: 'provider:assigned',
  PROVIDER_ONLINE_STATUS: 'provider:online:status',
  REQUEST_CANCELLED: 'request:cancelled',
  REQUEST_CREATED: 'request:created',
  ERROR: 'error:event',
  AUTH_CONNECTED: 'auth:connected',
  HEARTBEAT_ACK: 'heartbeat:ack',
} as const;
