


import { generateToken } from '@/lib/crypto';
import sql from '@/lib/db';


const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;


export async function createToken(userId: string): Promise<string> {
  const token = generateToken(64);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

  await sql`
    INSERT INTO "SessionToken" ("token", "userId", "expiresAt", "userAgent", "ipAddress")
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()}, '', '')
  `;

  return token;
}


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


export async function revokeToken(token: string): Promise<void> {
  try {
    await sql`DELETE FROM "SessionToken" WHERE "token" = ${token}`;
  } catch {

  }
}


export async function revokeAllUserTokens(userId: string): Promise<void> {
  await sql`DELETE FROM "SessionToken" WHERE "userId" = ${userId}`;
}


export async function cleanupExpiredTokens(): Promise<number> {
  const result = await sql`
    DELETE FROM "SessionToken" WHERE "expiresAt" < NOW()
  `;
  return result.count;
}


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


    const { tokenExpiresAt, ...user } = row;
    return user;
  } catch {
    return null;
  }
}
