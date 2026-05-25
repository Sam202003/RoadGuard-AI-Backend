import { UserRepository } from './repositories/user.repository.js';
import { UserService } from './services/user.service.js';

let userRepository: UserRepository | null = null;
let userService: UserService | null = null;

export function initUsersModule(): void {
  userRepository = new UserRepository();
  userService = new UserService(userRepository);
}

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    throw new Error('Users module not initialized');
  }
  return userRepository;
}

export function getUserService(): UserService {
  if (!userService) {
    throw new Error('Users module not initialized');
  }
  return userService;
}

export type { SafeUser, IUser, UserDocument } from './interfaces/user.interface.js';
export { UserModel } from './schemas/user.schema.js';
