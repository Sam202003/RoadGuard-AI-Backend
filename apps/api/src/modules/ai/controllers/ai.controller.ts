import type { Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response.util.js';
import { getAiDiagnosisService } from '../index.js';
import type {
  DiagnoseBody,
  DiagnosisIdParams,
  ListDiagnosisHistoryQuery,
} from '../validators/ai.validator.js';

export async function diagnoseBreakdown(req: Request, res: Response): Promise<void> {
  const body = req.body as DiagnoseBody;
  const diagnosis = await getAiDiagnosisService().diagnose(req.user!.id, body);

  sendSuccess(res, {
    message: 'Diagnosis generated successfully',
    data: { diagnosis },
  });
}

export async function listDiagnosisHistory(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListDiagnosisHistoryQuery;
  const { diagnoses, meta } = await getAiDiagnosisService().listHistory(req.user!.id, query);

  sendSuccess(res, {
    message: 'Diagnosis history fetched successfully',
    data: { diagnoses },
    meta: { ...meta },
  });
}

export async function getDiagnosisById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as DiagnosisIdParams;
  const diagnosis = await getAiDiagnosisService().getById(req.user!.id, id);

  sendSuccess(res, {
    message: 'Diagnosis fetched successfully',
    data: { diagnosis },
  });
}
