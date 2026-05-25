import type { AppLocals } from './api.types.js';
import type { AuthenticatedUser } from '../modules/auth/interfaces/auth.interface.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }

    interface Locals extends AppLocals {}
  }
}

export {};
