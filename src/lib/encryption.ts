


import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

function getKey(): Buffer | null {
  const raw = process.env.CREDENTIALS_ENC_KEY;
  if (!raw) return null;
  try {
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      console.error('[encryption] CREDENTIALS_ENC_KEY must decode to 32 bytes.');
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}


export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    console.warn('[encryption] CREDENTIALS_ENC_KEY not set; storing value unencrypted.');
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value;

  const key = getKey();
  if (!key) {
    console.error('[encryption] Cannot decrypt: CREDENTIALS_ENC_KEY not set.');
    return '';
  }

  try {
    const [, , ivB64, tagB64, ctB64] = value.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[encryption] Decryption failed:', error);
    return '';
  }
}
