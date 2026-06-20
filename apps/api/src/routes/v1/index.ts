import { Router, type IRouter } from 'express';
import { adminRouter } from '../../modules/admin/index.js';
import { aiRouter } from '../../modules/ai/index.js';
import { authRouter } from '../../modules/auth/index.js';
import { healthRouter } from '../../modules/health/index.js';
import { breakdownRequestRouter } from '../../modules/breakdown-requests/index.js';
import { notificationRouter } from '../../modules/notifications/index.js';
import { providerRouter } from '../../modules/providers/index.js';
import { vehicleRouter } from '../../modules/vehicles/index.js';

export const v1Router: IRouter = Router();

v1Router.use(healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/ai', aiRouter);
v1Router.use('/vehicles', vehicleRouter);
v1Router.use('/providers', providerRouter);
v1Router.use('/breakdown-requests', breakdownRequestRouter);
v1Router.use('/notifications', notificationRouter);
v1Router.use('/admin', adminRouter);
