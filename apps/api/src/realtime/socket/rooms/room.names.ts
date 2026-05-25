export const RoomNames = {
  request: (requestId: string) => `request:${requestId}`,
  provider: (providerId: string) => `provider:${providerId}`,
  customer: (customerId: string) => `customer:${customerId}`,
  user: (userId: string) => `user:${userId}`,
  adminMonitoring: () => 'admin:monitoring',
} as const;
