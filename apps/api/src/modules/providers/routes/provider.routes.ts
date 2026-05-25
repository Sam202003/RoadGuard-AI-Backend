import { Router, type IRouter } from 'express';
import { UserRole } from '@roadguard/types';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  getMyProvider,
  getNearbyProviders,
  onboardProvider,
  updateAvailability,
  updateLocation,
  updateMyProvider,
} from '../controllers/provider.controller.js';
import {
  nearbyProvidersQuerySchema,
  onboardProviderSchema,
  updateAvailabilitySchema,
  updateLocationSchema,
  updateProviderSchema,
} from '../validators/provider.validator.js';

const providerOnly = [authenticate, requireRoles(UserRole.PROVIDER)];

export const providerRouter: IRouter = Router();

providerRouter.get(
  '/nearby',
  authenticate,
  validate({ query: nearbyProvidersQuerySchema }),
  asyncHandler(getNearbyProviders),
);

providerRouter.post(
  '/',
  ...providerOnly,
  validate({ body: onboardProviderSchema }),
  asyncHandler(onboardProvider),
);

providerRouter.get('/me', ...providerOnly, asyncHandler(getMyProvider));

providerRouter.patch(
  '/me',
  ...providerOnly,
  validate({ body: updateProviderSchema }),
  asyncHandler(updateMyProvider),
);

providerRouter.patch(
  '/availability',
  ...providerOnly,
  validate({ body: updateAvailabilitySchema }),
  asyncHandler(updateAvailability),
);

providerRouter.patch(
  '/location',
  ...providerOnly,
  validate({ body: updateLocationSchema }),
  asyncHandler(updateLocation),
);
