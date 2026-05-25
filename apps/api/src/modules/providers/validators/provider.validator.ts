import { z } from 'zod';
import {
  AvailabilityStatus,
  OnlineStatus,
  ProviderType,
} from '../constants/provider.enums.js';

const phoneSchema = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number');

const geoPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z
    .tuple([z.coerce.number().min(-180).max(180), z.coerce.number().min(-90).max(90)])
    .refine(([lng, lat]) => lng !== 0 || lat !== 0, {
      message: 'coordinates cannot be [0, 0]',
    }),
});

const vehicleDetailsSchema = z.object({
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  registrationNumber: z.string().optional(),
});

const documentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.string().min(1),
  uploadedAt: z.coerce.date().optional(),
});

const bankDetailsSchema = z.object({
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
});

export const onboardProviderSchema = z.object({
  businessName: z.string().min(2).max(120).trim(),
  providerType: z.nativeEnum(ProviderType),
  servicesOffered: z.array(z.string().min(1).max(80)).min(1).max(20),
  phoneNumber: phoneSchema,
  alternatePhoneNumber: z.union([phoneSchema, z.null()]).optional(),
  email: z.string().email().toLowerCase().trim(),
  profileImage: z.string().url().optional().nullable(),
  currentLocation: geoPointSchema.optional().nullable(),
  serviceRadius: z.coerce.number().min(1).max(100).default(10),
  vehicleDetails: vehicleDetailsSchema.optional().nullable(),
  documents: z.array(documentSchema).max(20).optional().default([]),
  bankDetails: bankDetailsSchema.optional().nullable(),
});

export const updateProviderSchema = onboardProviderSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update',
  });

export const updateAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  onlineStatus: z.nativeEnum(OnlineStatus).optional(),
}).refine((data) => data.availabilityStatus !== undefined || data.onlineStatus !== undefined, {
  message: 'availabilityStatus or onlineStatus is required',
});

export const updateLocationSchema = z.object({
  currentLocation: geoPointSchema,
  serviceRadius: z.coerce.number().min(1).max(100).optional(),
});

export const nearbyProvidersQuerySchema = z.object({
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  radiusKm: z.coerce.number().min(0.1).max(100).default(10),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  onlineOnly: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  kycVerifiedOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  providerType: z.nativeEnum(ProviderType).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type OnboardProviderBody = z.infer<typeof onboardProviderSchema>;
export type UpdateProviderBody = z.infer<typeof updateProviderSchema>;
export type UpdateAvailabilityBody = z.infer<typeof updateAvailabilitySchema>;
export type UpdateLocationBody = z.infer<typeof updateLocationSchema>;
export type NearbyProvidersQuery = z.infer<typeof nearbyProvidersQuerySchema>;
