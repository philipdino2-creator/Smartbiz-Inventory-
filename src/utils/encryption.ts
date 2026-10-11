import crypto from 'crypto';

/**
 * Validates whether the encryption key environment variable is configured and valid (32 bytes).
 */
export function getEncryptionKey(): Buffer | null {
  const hexOrBase64 = process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY;
  if (!hexOrBase64) return null;

  // Supports 64-char hex string (32 bytes) or raw 32-char string
  if (hexOrBase64.length === 64 && /^[0-9a-fA-F]+$/.test(hexOrBase64)) {
    return Buffer.from(hexOrBase64, 'hex');
  }
  if (Buffer.byteLength(hexOrBase64, 'utf8') === 32) {
    return Buffer.from(hexOrBase64, 'utf8');
  }
  return null;
}

/**
 * Encrypts a plaintext string using authenticated AES-256-GCM.
 * Format: v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptAes256Gcm(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error('ENCRYPTION_KEY_NOT_CONFIGURED: Valid 32-byte PAYSTACK_TOKEN_ENCRYPTION_KEY is required.');
  }

  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a versioned AES-256-GCM ciphertext.
 */
export function decryptAes256Gcm(versionedCiphertext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error('ENCRYPTION_KEY_NOT_CONFIGURED: Valid 32-byte PAYSTACK_TOKEN_ENCRYPTION_KEY is required.');
  }

  const parts = versionedCiphertext.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('INVALID_CIPHERTEXT_FORMAT: Expected v1:<iv>:<tag>:<ciphertext>');
  }

  const [, ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error('INVALID_CIPHERTEXT_PARAMETERS: IV must be 12 bytes and AuthTag must be 16 bytes.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validates encryption configuration at startup or runtime.
 * Returns { valid: true, keyLengthBytes: 32 } or throws/returns detailed status.
 */
export function validateEncryptionConfig(requireKey: boolean = false): {
  isConfigured: boolean;
  isValid: boolean;
  errorMessage?: string;
} {
  const envVal = process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY;
  if (!envVal) {
    if (requireKey) {
      throw new Error('PAYSTACK_TOKEN_ENCRYPTION_KEY is required but not set.');
    }
    return { isConfigured: false, isValid: false, errorMessage: 'Key not set' };
  }
  const keyBuf = getEncryptionKey();
  if (!keyBuf || keyBuf.length !== 32) {
    const msg = 'PAYSTACK_TOKEN_ENCRYPTION_KEY must be a 64-character hex string or 32-character UTF-8 string (32 bytes).';
    if (requireKey) {
      throw new Error(msg);
    }
    return { isConfigured: true, isValid: false, errorMessage: msg };
  }
  return { isConfigured: true, isValid: true };
}
