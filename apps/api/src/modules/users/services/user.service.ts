import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import type { SafeUser, UserDocument } from '../interfaces/user.interface.js';
import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  toSafeUser(user: UserDocument): SafeUser {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage ?? null,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? null,
      emergencyContacts: user.emergencyContacts ?? [],
      addresses: user.addresses ?? [],
      preferences: user.preferences ?? {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getByIdOrThrow(userId: string): Promise<UserDocument> {
    const user = await this.userRepository.findActiveById(userId);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  async getSafeUserById(userId: string): Promise<SafeUser> {
    const user = await this.getByIdOrThrow(userId);
    return this.toSafeUser(user);
  }

  async ensureEmailAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
    }
  }

  async ensurePhoneAvailable(phoneNumber: string): Promise<void> {
    const existing = await this.userRepository.findByPhone(phoneNumber);

    if (existing) {
      throw new AppError('Phone number already registered', HTTP_STATUS.CONFLICT);
    }
  }
}
