import { Router, type IRouter } from 'express';
import { UserRole } from '@roadguard/types';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  assignProviderToRequest,
  cancelBreakdownRequest,
  createBreakdownRequest,
  getBreakdownRequest,
  listBreakdownRequests,
  updateBreakdownStatus,
} from '../controllers/breakdown.controller.js';
import {
  assignProviderSchema,
  breakdownRequestIdParamSchema,
  cancelBreakdownRequestSchema,
  createBreakdownRequestSchema,
  listBreakdownRequestsQuerySchema,
  updateBreakdownStatusSchema,
} from '../validators/breakdown.validator.js';

export const breakdownRequestRouter: IRouter = Router();

breakdownRequestRouter.use(authenticate);

breakdownRequestRouter.post(
  '/',
  requireRoles(UserRole.CUSTOMER),
  validate({ body: createBreakdownRequestSchema }),
  asyncHandler(createBreakdownRequest),
);

breakdownRequestRouter.get(
  '/',
  validate({ query: listBreakdownRequestsQuerySchema }),
  asyncHandler(listBreakdownRequests),
);

breakdownRequestRouter.get(
  '/:id',
  validate({ params: breakdownRequestIdParamSchema }),
  asyncHandler(getBreakdownRequest),
);

breakdownRequestRouter.patch(
  '/:id/status',
  requireRoles(UserRole.PROVIDER, UserRole.ADMIN),
  validate({ params: breakdownRequestIdParamSchema, body: updateBreakdownStatusSchema }),
  asyncHandler(updateBreakdownStatus),
);

breakdownRequestRouter.patch(
  '/:id/assign-provider',
  requireRoles(UserRole.ADMIN),
  validate({ params: breakdownRequestIdParamSchema, body: assignProviderSchema }),
  asyncHandler(assignProviderToRequest),
);

breakdownRequestRouter.patch(
  '/:id/cancel',
  requireRoles(UserRole.CUSTOMER, UserRole.ADMIN),
  validate({ params: breakdownRequestIdParamSchema, body: cancelBreakdownRequestSchema }),
  asyncHandler(cancelBreakdownRequest),
);
