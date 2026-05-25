import type { Env } from '@roadguard/config';
import { UserRole } from '@roadguard/types';
import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import type { RegisterInput, LoginInput, AuthResultDto } from '../dto/auth.dto.js';
import type { AuthTokens, JwtPayload } from '../interfaces/auth.interface.js';
import {
  comparePassword,
  getSaltRounds,
  hashPassword,
} from '../utils/password.util.js';
import {
  createTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
} from '../utils/token.util.js';
import { getUserRepository, getUserService } from '../../users/index.js';
import type { StoredRefreshToken, UserDocument } from '../../users/interfaces/user.interface.js';

export class AuthService {
  constructor(private readonly env: Env) {}

  private get tokensMeta(): AuthTokens['expiresIn'] {
    return this.env.JWT_ACCESS_EXPIRES_IN;
  }

  private buildAuthResult(
    user: UserDocument,
    tokens: { accessToken: string; refreshToken: string },
  ): AuthResultDto {
    const userService = getUserService();

    return {
      user: userService.toSafeUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.tokensMeta,
      },
    };
  }

  private getRefreshExpiryDate(): Date {
    const match = /^(\d+)([dhms])$/.exec(this.env.JWT_REFRESH_EXPIRES_IN);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multipliers[unit] ?? multipliers.d));
  }

  private async persistRefreshToken(
    user: UserDocument,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = this.getRefreshExpiryDate();

    const newEntry: StoredRefreshToken = {
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    };

    const activeTokens = (user.refreshTokens ?? []).filter(
      (t) => t.expiresAt > new Date(),
    );

    activeTokens.push(newEntry);

    const maxSessions = this.env.MAX_REFRESH_SESSIONS;
    const trimmed =
      activeTokens.length > maxSessions
        ? activeTokens.slice(activeTokens.length - maxSessions)
        : activeTokens;

    user.refreshTokens = trimmed;
    user.lastLoginAt = new Date();
    await user.save();
  }

  private async findValidRefreshSession(
    user: UserDocument,
    refreshToken: string,
  ): Promise<boolean> {
    const tokenHash = hashRefreshToken(refreshToken);
    const now = new Date();

    return (user.refreshTokens ?? []).some(
      (t) => t.tokenHash === tokenHash && t.expiresAt > now,
    );
  }

  async register(input: RegisterInput): Promise<AuthResultDto> {
    const userService = getUserService();
    const userRepository = getUserRepository();

    await userService.ensureEmailAvailable(input.email);
    await userService.ensurePhoneAvailable(input.phoneNumber);

    const hashedPassword = await hashPassword(input.password, getSaltRounds(this.env));

    const user = await userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      password: hashedPassword,
      role: input.role ?? UserRole.CUSTOMER,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      refreshTokens: [],
      emergencyContacts: [],
      addresses: [],
      preferences: {},
    });

    const tokens = createTokenPair(this.env, {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.persistRefreshToken(user, tokens.refreshToken);

    return this.buildAuthResult(user, tokens);
  }

  async login(input: LoginInput): Promise<AuthResultDto> {
    const userRepository = getUserRepository();
    const user = await userRepository.findByEmailWithPassword(input.email);

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const isValid = await comparePassword(input.password, user.password);

    if (!isValid) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = createTokenPair(this.env, {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.persistRefreshToken(user, tokens.refreshToken);

    return this.buildAuthResult(user, tokens);
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload: JwtPayload = verifyRefreshToken(this.env, refreshToken);
    const userRepository = getUserRepository();
    const user = await userRepository.findActiveById(payload.sub);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    const isValidSession = await this.findValidRefreshSession(user, refreshToken);

    if (!isValidSession) {
      throw new AppError('Refresh token revoked or expired', HTTP_STATUS.UNAUTHORIZED);
    }

    const { accessToken, refreshToken: newRefreshToken } = createTokenPair(this.env, {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.revokeRefreshToken(user._id.toString(), refreshToken);

    const reloaded = await userRepository.findById(user._id.toString());
    if (!reloaded) {
      throw AppError.notFound('User not found');
    }

    await this.persistRefreshToken(reloaded, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.tokensMeta,
    };
  }

  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const userRepository = getUserRepository();
    const user = await userRepository.findById(userId);

    if (!user) return;

    const tokenHash = hashRefreshToken(refreshToken);
    user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t.tokenHash !== tokenHash);
    await user.save();
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      throw AppError.badRequest('refreshToken is required to logout session');
    }

    await this.revokeRefreshToken(userId, refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    const userRepository = getUserRepository();
    const user = await userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    user.refreshTokens = [];
    await user.save();
  }

  async getMe(userId: string) {
    return getUserService().getSafeUserById(userId);
  }
}
