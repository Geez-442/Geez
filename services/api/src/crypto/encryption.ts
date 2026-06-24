import * as crypto from 'crypto';

/**
 * Encryption utility for protecting sensitive bid fields (amount, doc metadata, etc.)
 * Uses AES-256-CBC with PBKDF2-derived key from env secret.
 * 
 * Security Note (Prototype):
 * - Key is derived from process.env.ENCRYPTION_KEY at runtime (not stored in DB).
 * - IV is randomly generated per encryption and stored with ciphertext.
 * - For production: use dedicated key management service (AWS KMS, HashiCorp Vault, etc.)
 * - Key rotation strategy must be implemented before going live.
 */

const ENCRYPTION_ALGO = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 16; // 128 bits for CBC mode
const SALT = Buffer.from('zets-bid-vault-salt-change-in-prod', 'utf8'); // NOTE: Change salt in production

/**
 * Derive encryption key from secret using PBKDF2.
 * @param secret - Base secret (from env or key store)
 * @returns 32-byte key suitable for AES-256
 */
export function deriveKey(secret: string): Buffer {
  return crypto.pbkdf2Sync(secret, SALT, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a plaintext string and return base64-encoded ciphertext + IV.
 * Format: "iv:ciphertext" (both base64-encoded).
 * @param plaintext - Data to encrypt
 * @param secret - Encryption secret (from env)
 * @returns Encrypted payload as string
 */
export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const ivBase64 = iv.toString('base64');
  return `${ivBase64}:${encrypted}`;
}

/**
 * Decrypt a ciphertext + IV pair.
 * @param payload - Encrypted payload (format: "iv:ciphertext")
 * @param secret - Decryption secret
 * @returns Decrypted plaintext
 */
export function decrypt(payload: string, secret: string): string {
  const key = deriveKey(secret);
  const [ivBase64, ciphertextBase64] = payload.split(':');
  if (!ivBase64 || !ciphertextBase64) throw new Error('Invalid encrypted payload format');

  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, key, iv);

  let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
