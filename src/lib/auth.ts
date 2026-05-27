/**
 * Authentication utilities
 * Token generation, validation, and session management
 */

import { generateToken } from '@/lib/crypto';
import sql from '@/lib/db';

/**
 * Session token configuration
 */
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a session token for a user
 */
export async function createToken(userId: string): Promise<string> {
  const token = generateToken(64);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

  await sql`
    INSERT INTO "SessionToken" ("token", "userId", "expiresAt", "userAgent", "ipAddress")
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()}, '', '')
  `;

  return token;
}

/**
 * Validate a session token
 */
export async function validateToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const [sessionToken] = await sql`
      SELECT * FROM "SessionToken" WHERE "token" = ${token}
    `;

    if (!sessionToken) {
      return false;
    }

    if (sessionToken.userId !== userId) {
      return false;
    }

    if (new Date(sessionToken.expiresAt) < new Date()) {
      await sql`DELETE FROM "SessionToken" WHERE "token" = ${token}`;
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke a session token
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await sql`DELETE FROM "SessionToken" WHERE "token" = ${token}`;
  } catch {
    // Token may not exist, ignore
  }
}

/**
 * Revoke all tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await sql`DELETE FROM "SessionToken" WHERE "userId" = ${userId}`;
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await sql`
    DELETE FROM "SessionToken" WHERE "expiresAt" < NOW()
  `;
  return result.count;
}

/**
 * Get user from session token
 */
export async function getUserFromToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const rows = await sql`
      SELECT u."id", u."name", u."email", u."username", u."role",
             u."image", u."phone", u."lastLogin", u."lastLoginIP",
             u."lastLoginCountry", u."currentPath", u."lastActive",
             u."birthday", u."schedule", u."tempSchedule", u."createdAt",
             st."expiresAt" as "tokenExpiresAt"
      FROM "SessionToken" st
      JOIN "User" u ON u."id" = st."userId"
      WHERE st."token" = ${token}
    `;

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    if (new Date(row.tokenExpiresAt) < new Date()) {
      await sql`DELETE FROM "SessionToken" WHERE "token" = ${token}`;
      return null;
    }

    // Exclude password from the returned user object
    const { tokenExpiresAt, ...user } = row;
    return user;
  } catch {
    return null;
  }
}
