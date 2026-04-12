/**
 * Cryptography utilities for password hashing and verification
 */

/**
 * Hash a password using bcrypt (simple implementation for now)
 * In production, use bcrypt or argon2
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // For now, we'll use a simple hash since we're maintaining backward compatibility
  // In production, this should be replaced with bcrypt or argon2
  // Example: await bcrypt.hash(password, 10);
  
  // Simple hash for backward compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For backward compatibility with plain text passwords
  if (password === hash) {
    return true;
  }
  
  // Compare with hashed password
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Generate a random token
 * 
 * @param length - Length of the token in bytes
 * @returns Hex encoded random token
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random string
 * 
 * @param length - Length of the string
 * @returns Random string
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
}
