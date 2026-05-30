


import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

function getKey(raw: string | undefined, label: string): Buffer | null {
  if (!raw) return null;
  try {
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      console.error(`[encryption] ${label} must decode to 32 bytes.`);
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

function getCredentialsKey(): Buffer | null {
  return getKey(process.env.CREDENTIALS_ENC_KEY, 'CREDENTIALS_ENC_KEY');
}

function getFileKey(): Buffer | null {
  return getKey(
    process.env.FILE_ENC_KEY || process.env.CREDENTIALS_ENC_KEY,
    'FILE_ENC_KEY/CREDENTIALS_ENC_KEY'
  );
}

export function hasEncryptionKey(): boolean {
  return !!getFileKey();
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}


export function encryptSecret(plaintext: string): string {
  const key = getCredentialsKey();
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

export function encryptBuffer(plaintext: Buffer): {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
} {
  const key = getFileKey();
  if (!key) {
    throw new Error('FILE_ENC_KEY or CREDENTIALS_ENC_KEY is required for encrypted file storage.');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag: tag.toString('base64'),
  };
}

export function decryptBuffer({
  ciphertext,
  iv,
  authTag,
}: {
  ciphertext: Buffer | Uint8Array;
  iv: string;
  authTag: string;
}): Buffer {
  const key = getFileKey();
  if (!key) {
    throw new Error('FILE_ENC_KEY or CREDENTIALS_ENC_KEY is required to decrypt files.');
  }

  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext)),
    decipher.final(),
  ]);
}

export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value;

  const key = getCredentialsKey();
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
