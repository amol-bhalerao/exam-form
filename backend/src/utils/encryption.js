import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'hsc-exam-salt-2025';

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    // In development, use a warning; in production this must be set
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production (min 16 chars)');
    }
    return crypto.scryptSync('dev-default-key-not-for-prod', SALT, 32);
  }
  return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string.
 * Returns null/empty if input is null/empty.
 * Returns an iv.ciphertext.authTag hex string.
 * @param {string|null|undefined} text
 * @returns {string|null}
 */
export function encrypt(text) {
  if (text == null || text === '') return text ?? null;
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${encrypted.toString('hex')}.${authTag.toString('hex')}`;
}

/**
 * Decrypt a previously encrypted string.
 * Returns the original unencrypted value.
 * Safely returns the input as-is if decryption fails (e.g. plain legacy data).
 * @param {string|null|undefined} encryptedText
 * @returns {string|null}
 */
export function decrypt(encryptedText) {
  if (encryptedText == null || encryptedText === '') return encryptedText ?? null;
  const parts = encryptedText.split('.');
  if (parts.length !== 3) return encryptedText; // not encrypted format – return as-is
  const [ivHex, dataHex, tagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(dataHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return encryptedText; // Return as-is on failure
  }
}

/**
 * Mask a sensitive string for display (show only last 4 chars).
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function mask(value) {
  if (!value) return value ?? null;
  const s = String(value);
  if (s.length <= 4) return '****';
  return '*'.repeat(s.length - 4) + s.slice(-4);
}
