import { z } from 'zod';
import { UserRole } from '@roadguard/types';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
} from '../../providers/constants/provider.enums.js';

export const listAdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const adminUserIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user id'),
});

export const updateAdminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listAdminProvidersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  onlineStatus: z.nativeEnum(OnlineStatus).optional(),
});

export const adminProviderIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid provider id'),
});

export const updateAdminProviderKycSchema = z.object({
  kycStatus: z.nativeEnum(KycStatus),
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type UpdateAdminUserStatusBody = z.infer<typeof updateAdminUserStatusSchema>;
export type ListAdminProvidersQuery = z.infer<typeof listAdminProvidersQuerySchema>;
export type AdminUserIdParams = z.infer<typeof adminUserIdParamSchema>;
export type AdminProviderIdParams = z.infer<typeof adminProviderIdParamSchema>;
export type UpdateAdminProviderKycBody = z.infer<typeof updateAdminProviderKycSchema>;
