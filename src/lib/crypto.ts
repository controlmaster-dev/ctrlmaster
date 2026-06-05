


import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SCRYPT_PREFIX = 'scrypt$';


export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${SCRYPT_PREFIX}${salt}$${derived.toString('hex')}`;
}

function legacySha256(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;

  if (hash.startsWith(SCRYPT_PREFIX)) {
    const [, salt, key] = hash.split('$');
    if (!salt || !key) return false;
    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const stored = Buffer.from(key, 'hex');
    if (stored.length !== derived.length) return false;
    return timingSafeEqual(stored, derived);
  }

  return legacySha256(password) === hash;
}

export function needsRehash(hash: string): boolean {
  return !hash || !hash.startsWith(SCRYPT_PREFIX);
}

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
