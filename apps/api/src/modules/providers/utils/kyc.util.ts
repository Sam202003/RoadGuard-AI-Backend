import { AppError } from '../../../errors/index.js';
import { HTTP_STATUS } from '../../../constants/index.js';
import { KycStatus } from '../constants/provider.enums.js';
import type { ProviderMongoDocument } from '../interfaces/provider.interface.js';

export function assertKycVerified(provider: ProviderMongoDocument): void {
  if (provider.kycStatus !== KycStatus.VERIFIED) {
    throw new AppError(
      'Provider KYC must be verified before going online or accepting assignments',
      HTTP_STATUS.FORBIDDEN,
    );
  }
}
