import { Router, type IRouter } from 'express';
import { UserRole } from '@roadguard/types';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  getAnalytics,
  getDashboard,
  getProvider,
  getUser,
  listProviders,
  listUsers,
  updateProviderKyc,
  updateUserStatus,
} from '../controllers/admin.controller.js';
import {
  adminProviderIdParamSchema,
  adminUserIdParamSchema,
  listAdminProvidersQuerySchema,
  listAdminUsersQuerySchema,
  updateAdminProviderKycSchema,
  updateAdminUserStatusSchema,
} from '../validators/admin.validator.js';

export const adminRouter: IRouter = Router();

adminRouter.use(authenticate, requireRoles(UserRole.ADMIN));

adminRouter.get('/dashboard', asyncHandler(getDashboard));
adminRouter.get('/analytics', asyncHandler(getAnalytics));

adminRouter.get(
  '/users',
  validate({ query: listAdminUsersQuerySchema }),
  asyncHandler(listUsers),
);
adminRouter.get(
  '/users/:id',
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(getUser),
);
adminRouter.patch(
  '/users/:id/status',
  validate({ params: adminUserIdParamSchema, body: updateAdminUserStatusSchema }),
  asyncHandler(updateUserStatus),
);

adminRouter.get(
  '/providers',
  validate({ query: listAdminProvidersQuerySchema }),
  asyncHandler(listProviders),
);
adminRouter.get(
  '/providers/:id',
  validate({ params: adminProviderIdParamSchema }),
  asyncHandler(getProvider),
);
adminRouter.patch(
  '/providers/:id/kyc-status',
  validate({ params: adminProviderIdParamSchema, body: updateAdminProviderKycSchema }),
  asyncHandler(updateProviderKyc),
);
