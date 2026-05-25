import { Router, type IRouter } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.validator.js';
import {
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
} from '../controllers/auth.controller.js';

export const authRouter: IRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(register));
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(login));
authRouter.post(
  '/refresh-token',
  validate({ body: refreshTokenSchema }),
  asyncHandler(refreshToken),
);

authRouter.post('/logout', authenticate, validate({ body: logoutSchema }), asyncHandler(logout));
authRouter.post('/logout-all', authenticate, asyncHandler(logoutAll));
authRouter.get('/me', authenticate, asyncHandler(getMe));
