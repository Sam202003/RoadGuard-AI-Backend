import { z } from 'zod';
import { ProviderType } from '../../providers/constants/provider.enums.js';
import { DiagnosisSeverity, EmergencyLevel } from '../constants/ai.enums.js';

export const aiDiagnosisResultSchema = z.object({
  probableIssue: z.string().min(1).max(500),
  severity: z.nativeEnum(DiagnosisSeverity),
  safeToDrive: z.boolean(),
  emergencyLevel: z.nativeEnum(EmergencyLevel),
  recommendedProvider: z.nativeEnum(ProviderType),
  precautions: z.array(z.string().min(1).max(500)).min(1).max(8),
  temporaryAdvice: z.string().min(1).max(2000),
});

export type AiDiagnosisResult = z.infer<typeof aiDiagnosisResultSchema>;

export const diagnoseBodySchema = z.object({
  message: z.string().min(3).max(4000),
  vehicleId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid vehicle id')
    .optional(),
  contextMessages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
});

export type DiagnoseBody = z.infer<typeof diagnoseBodySchema>;

export const listDiagnosisHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  sort: z.string().optional(),
});

export type ListDiagnosisHistoryQuery = z.infer<typeof listDiagnosisHistoryQuerySchema>;

export const diagnosisIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid diagnosis id'),
});

export type DiagnosisIdParams = z.infer<typeof diagnosisIdParamSchema>;