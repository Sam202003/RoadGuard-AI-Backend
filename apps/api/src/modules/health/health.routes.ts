import { Router, type IRouter } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { getHealth } from './health.controller.js';

export const healthRouter: IRouter = Router();

healthRouter.get('/health', asyncHandler(getHealth));
