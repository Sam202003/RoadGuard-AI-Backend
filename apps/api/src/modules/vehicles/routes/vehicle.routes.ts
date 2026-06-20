import { Router, type IRouter } from 'express';
import { UserRole } from '@roadguard/types';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { requireRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from '../controllers/vehicle.controller.js';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from '../validators/vehicle.validator.js';

export const vehicleRouter: IRouter = Router();

vehicleRouter.use(authenticate, requireRoles(UserRole.CUSTOMER));

vehicleRouter.post('/', validate({ body: createVehicleSchema }), asyncHandler(createVehicle));
vehicleRouter.get('/', validate({ query: listVehiclesQuerySchema }), asyncHandler(listVehicles));
vehicleRouter.get(
  '/:id',
  validate({ params: vehicleIdParamSchema }),
  asyncHandler(getVehicle),
);
vehicleRouter.patch(
  '/:id',
  validate({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  asyncHandler(updateVehicle),
);
vehicleRouter.delete(
  '/:id',
  validate({ params: vehicleIdParamSchema }),
  asyncHandler(deleteVehicle),
);
