/**
 * Authentication utilities
 * Token generation, validation, and session management
 */

import { generateToken } from '@/lib/crypto';
import prisma from '@/lib/prisma';

/**
 * Session token configuration
 */
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a session token for a user
 *
 * @param userId - User ID
 * @returns Session token
 */
export async function createToken(userId: string): Promise<string> {
  const token = generateToken(64);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

  // Store token in database
  await prisma.sessionToken.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: '',
      ipAddress: '',
    },
  });

  return token;
}

/**
 * Validate a session token
 *
 * @param userId - User ID
 * @param token - Session token
 * @returns True if token is valid
 */
export async function validateToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const sessionToken = await prisma.sessionToken.findUnique({
      where: { token },
    });

    if (!sessionToken) {
      return false;
    }

    // Check if token belongs to user
    if (sessionToken.userId !== userId) {
      return false;
    }

    // Check if token is expired
    if (sessionToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.sessionToken.delete({
        where: { token },
      });
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke a session token
 *
 * @param token - Session token to revoke
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await prisma.sessionToken.delete({
      where: { token },
    });
  } catch {
    // Token may not exist, ignore
  }
}

/**
 * Revoke all tokens for a user
 *
 * @param userId - User ID
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.sessionToken.deleteMany({
    where: { userId },
  });
}

/**
 * Clean up expired tokens
 * Should be called periodically (e.g., in a cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.sessionToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get user from session token
 *
 * @param token - Session token
 * @returns User object or null
 */
export async function getUserFromToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const sessionToken = await prisma.sessionToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!sessionToken) {
      return null;
    }

    // Check if token is expired
    if (sessionToken.expiresAt < new Date()) {
      await prisma.sessionToken.delete({
        where: { token },
      });
      return null;
    }

    const { password, ...userWithoutPassword } = sessionToken.user;
    return userWithoutPassword;
  } catch {
    return null;
  }
}
