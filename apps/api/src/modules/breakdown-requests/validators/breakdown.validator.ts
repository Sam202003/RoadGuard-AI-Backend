import { z } from 'zod';
import {
  BreakdownStatus,
  IssueType,
  RequestPriority,
} from '../constants/breakdown.enums.js';

const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .refine(([lon, lat]) => lon !== 0 || lat !== 0, {
      message: 'Invalid coordinates',
    }),
});

export const createBreakdownRequestSchema = z.object({
  vehicleId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid vehicle id'),
  issueType: z.nativeEnum(IssueType),
  issueDescription: z.string().min(10).max(2000).trim(),
  images: z.array(z.string().url()).max(10).optional().default([]),
  priority: z.nativeEnum(RequestPriority).optional(),
  location: geoPointSchema,
  aiDiagnosisSummary: z.string().max(2000).trim().optional().nullable(),
  notes: z.string().max(1000).trim().optional().nullable(),
  trackingEnabled: z.boolean().optional().default(true),
  searchRadiusKm: z.coerce.number().min(1).max(50).optional().default(15),
});

export const breakdownRequestIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid breakdown request id'),
});

export const listBreakdownRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(BreakdownStatus).optional(),
});

export const updateBreakdownStatusSchema = z.object({
  status: z.nativeEnum(BreakdownStatus),
  notes: z.string().max(1000).trim().optional().nullable(),
  serviceCost: z.coerce.number().min(0).optional().nullable(),
});

export const assignProviderSchema = z.object({
  providerId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid provider id'),
});

export const cancelBreakdownRequestSchema = z.object({
  cancellationReason: z.string().min(3).max(500).trim(),
});

export type CreateBreakdownRequestBody = z.infer<typeof createBreakdownRequestSchema>;
export type BreakdownRequestIdParams = z.infer<typeof breakdownRequestIdParamSchema>;
export type ListBreakdownRequestsQuery = z.infer<typeof listBreakdownRequestsQuerySchema>;
export type UpdateBreakdownStatusBody = z.infer<typeof updateBreakdownStatusSchema>;
export type AssignProviderBody = z.infer<typeof assignProviderSchema>;
export type CancelBreakdownRequestBody = z.infer<typeof cancelBreakdownRequestSchema>;
