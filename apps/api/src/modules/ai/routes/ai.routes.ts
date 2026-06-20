import { Router, type IRouter } from 'express';
import { UserRole } from '@roadguard/types';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  diagnoseBreakdown,
  getDiagnosisById,
  listDiagnosisHistory,
} from '../controllers/ai.controller.js';
import {
  diagnoseBodySchema,
  diagnosisIdParamSchema,
  listDiagnosisHistoryQuerySchema,
} from '../validators/ai.validator.js';

export const aiRouter: IRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(requireRoles(UserRole.CUSTOMER));

aiRouter.post(
  '/diagnose',
  validate({ body: diagnoseBodySchema }),
  asyncHandler(diagnoseBreakdown),
);

aiRouter.get(
  '/diagnosis-history',
  validate({ query: listDiagnosisHistoryQuerySchema }),
  asyncHandler(listDiagnosisHistory),
);

aiRouter.get(
  '/diagnosis-history/:id',
  validate({ params: diagnosisIdParamSchema }),
  asyncHandler(getDiagnosisById),
);
