import { z } from 'zod';
import { FuelType, TransmissionType, VehicleDocumentType, VehicleType } from '../constants/vehicle.enums.js';

const vehicleDocumentSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  url: z.string().url().trim(),
  type: z.nativeEnum(VehicleDocumentType).default(VehicleDocumentType.OTHER),
  uploadedAt: z.coerce.date().optional(),
});

const baseVehicleFields = {
  vehicleType: z.nativeEnum(VehicleType),
  brand: z.string().min(1).max(80).trim(),
  model: z.string().min(1).max(80).trim(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  registrationNumber: z
    .string()
    .min(4)
    .max(20)
    .trim()
    .transform((v) => v.toUpperCase()),
  fuelType: z.nativeEnum(FuelType),
  transmissionType: z.nativeEnum(TransmissionType),
  color: z.string().max(40).trim().optional().nullable(),
  insuranceExpiryDate: z.coerce.date().optional().nullable(),
  pollutionExpiryDate: z.coerce.date().optional().nullable(),
  serviceDueDate: z.coerce.date().optional().nullable(),
  vehicleImages: z.array(z.string().url()).max(10).optional().default([]),
  documents: z.array(vehicleDocumentSchema).max(20).optional().default([]),
  isPrimaryVehicle: z.boolean().optional().default(false),
};

export const createVehicleSchema = z.object(baseVehicleFields);

export const updateVehicleSchema = createVehicleSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update',
  });

export const vehicleIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid vehicle id'),
});

export const listVehiclesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
});

export type CreateVehicleBody = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleBody = z.infer<typeof updateVehicleSchema>;
export type VehicleIdParams = z.infer<typeof vehicleIdParamSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
