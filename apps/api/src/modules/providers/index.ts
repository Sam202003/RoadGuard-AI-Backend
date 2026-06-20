import type { Env } from '@roadguard/config';
import { ProviderRepository } from './repositories/provider.repository.js';
import { ProviderService } from './services/provider.service.js';

let providerRepository: ProviderRepository | null = null;
let providerService: ProviderService | null = null;

export function initProvidersModule(env: Env): void {
  providerRepository = new ProviderRepository();
  providerService = new ProviderService(providerRepository, env);
}

export function getProviderService(): ProviderService {
  if (!providerService) {
    throw new Error('Providers module not initialized');
  }
  return providerService;
}

export function getProviderRepository(): ProviderRepository {
  if (!providerRepository) {
    throw new Error('Providers module not initialized');
  }
  return providerRepository;
}

export { providerRouter } from './routes/provider.routes.js';
export {
  ProviderType,
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
} from './constants/provider.enums.js';
export type { SafeProvider, NearbyProviderResult } from './interfaces/provider.interface.js';
