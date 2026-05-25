import type { UserRole } from '@roadguard/types';
import type { AuthTokens } from '../interfaces/auth.interface.js';
import type { SafeUser } from '../../users/index.js';

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken?: string;
}

export interface AuthResultDto {
  user: SafeUser;
  tokens: AuthTokens;
}
