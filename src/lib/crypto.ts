/**
 * Cryptography utilities for password hashing and verification.
 *
 * Passwords are hashed with scrypt (Node's built-in KDF) using a random
 * per-password salt. Stored format: `scrypt$<saltHex>$<hashHex>`.
 *
 * Legacy values (plaintext or unsalted SHA-256) are still accepted on verify
 * so existing accounts keep working; callers should use `needsRehash()` after
 * a successful login to lazily upgrade the stored hash.
 */

import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SCRYPT_PREFIX = 'scrypt$';

/**
 * Hash a password using scrypt with a random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${SCRYPT_PREFIX}${salt}$${derived.toString('hex')}`;
}

/**
 * Legacy unsalted SHA-256 hash (kept only to verify old records).
 */
function legacySha256(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a stored hash.
 * Supports the current scrypt format and legacy (plaintext / SHA-256) values.
 */
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

  // Legacy plaintext comparison
  if (password === hash) return true;

  // Legacy unsalted SHA-256 comparison
  return legacySha256(password) === hash;
}

/**
 * Returns true when a stored hash is not in the current scrypt format and
 * should be re-hashed (call after a successful verify to upgrade lazily).
 */
export function needsRehash(hash: string): boolean {
  return !hash || !hash.startsWith(SCRYPT_PREFIX);
}

/**
 * Generate a random token (hex encoded).
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a secure random string from an unambiguous alphabet.
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
