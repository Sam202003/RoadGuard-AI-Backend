import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';

export function isEncryptedValue(value: string): boolean {
  return value.startsWith(PREFIX);
}

/**
 * AES-256-GCM field encryption. Key must be 32 bytes (base64-encoded in env).
 * Legacy plaintext values are returned unchanged on decrypt.
 */
export function encryptField(plaintext: string, keyBase64: string): string {
  if (!plaintext) return plaintext;
  if (isEncryptedValue(plaintext)) return plaintext;

  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to 32 bytes');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptField(value: string, keyBase64: string): string {
  if (!value) return value;
  if (!isEncryptedValue(value)) return value;

  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to 32 bytes');
  }

  const payload = value.slice(PREFIX.length);
  const [ivB64, tagB64, ciphertextB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted field format');
  }

  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const ciphertext = Buffer.from(ciphertextB64, 'base64url');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return '****';
  return `****${accountNumber.slice(-4)}`;
}
