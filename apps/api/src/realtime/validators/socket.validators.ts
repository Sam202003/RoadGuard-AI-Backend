import { z } from 'zod';

const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

export const authConnectSchema = z.object({
  token: z.string().min(1).optional(),
});

export const providerLocationUpdateSchema = z.object({
  requestId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  location: geoPointSchema,
  speed: z.number().min(0).max(300).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime().optional(),
});

export const requestRoomSchema = z.object({
  requestId: z.string().regex(/^[a-fA-F0-9]{24}$/),
});

export const providerPresenceSchema = z.object({
  providerId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
});

export const heartbeatSchema = z.object({
  timestamp: z.string().datetime().optional(),
});

export type AuthConnectPayload = z.infer<typeof authConnectSchema>;
export type ProviderLocationUpdatePayload = z.infer<typeof providerLocationUpdateSchema>;
export type RequestRoomPayload = z.infer<typeof requestRoomSchema>;
export type ProviderPresencePayload = z.infer<typeof providerPresenceSchema>;
export type HeartbeatPayload = z.infer<typeof heartbeatSchema>;
