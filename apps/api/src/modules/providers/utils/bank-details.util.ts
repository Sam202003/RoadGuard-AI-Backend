import type { ProviderBankDetails } from '../interfaces/provider.interface.js';
import {
  decryptField,
  encryptField,
  isEncryptedValue,
  maskAccountNumber,
} from '../../../utils/field-encryption.util.js';

export function encryptBankDetails(
  bankDetails: ProviderBankDetails | null | undefined,
  encryptionKey: string | undefined,
): ProviderBankDetails | null {
  if (!bankDetails) return null;
  if (!encryptionKey) return bankDetails;

  return {
    accountHolderName: bankDetails.accountHolderName,
    bankName: bankDetails.bankName,
    accountNumber: bankDetails.accountNumber
      ? encryptField(bankDetails.accountNumber, encryptionKey)
      : bankDetails.accountNumber,
    ifscCode: bankDetails.ifscCode
      ? encryptField(bankDetails.ifscCode, encryptionKey)
      : bankDetails.ifscCode,
  };
}

export function decryptBankDetails(
  bankDetails: ProviderBankDetails | null | undefined,
  encryptionKey: string | undefined,
): ProviderBankDetails | null {
  if (!bankDetails) return null;
  if (!encryptionKey) return bankDetails;

  return {
    accountHolderName: bankDetails.accountHolderName,
    bankName: bankDetails.bankName,
    accountNumber: bankDetails.accountNumber
      ? decryptField(bankDetails.accountNumber, encryptionKey)
      : bankDetails.accountNumber,
    ifscCode: bankDetails.ifscCode
      ? decryptField(bankDetails.ifscCode, encryptionKey)
      : bankDetails.ifscCode,
  };
}

export function maskBankDetails(
  bankDetails: ProviderBankDetails | null | undefined,
  encryptionKey: string | undefined,
): ProviderBankDetails | null {
  const decrypted = decryptBankDetails(bankDetails, encryptionKey);
  if (!decrypted) return null;

  return {
    accountHolderName: decrypted.accountHolderName,
    bankName: decrypted.bankName,
    accountNumber: decrypted.accountNumber
      ? maskAccountNumber(decrypted.accountNumber)
      : decrypted.accountNumber,
    ifscCode: decrypted.ifscCode ? '****' : decrypted.ifscCode,
  };
}

export function bankDetailsNeedsEncryption(
  bankDetails: ProviderBankDetails | null | undefined,
): boolean {
  if (!bankDetails) return false;
  const { accountNumber, ifscCode } = bankDetails;
  return (
    (Boolean(accountNumber) && !isEncryptedValue(accountNumber ?? '')) ||
    (Boolean(ifscCode) && !isEncryptedValue(ifscCode ?? ''))
  );
}
