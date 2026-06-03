import sql from '@/lib/db';
import { generateToken } from '@/lib/crypto';

export { verifyCalendarFeedToken } from '@/lib/calendarFeedToken';

let columnEnsured = false;

export async function ensureCalendarFeedColumn(): Promise<void> {
  if (columnEnsured) return;
  await sql`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "calendarFeedToken" TEXT
  `;
  columnEnsured = true;
}

export async function getOrCreateCalendarFeedToken(userId: string): Promise<string | null> {
  await ensureCalendarFeedColumn();

  const [row] = await sql<{ calendarFeedToken: string | null }[]>`
    SELECT "calendarFeedToken" FROM "User" WHERE "id" = ${userId} LIMIT 1
  `;

  if (!row) return null;

  if (row.calendarFeedToken) {
    return row.calendarFeedToken;
  }

  const token = generateToken(32);
  await sql`
    UPDATE "User" SET "calendarFeedToken" = ${token} WHERE "id" = ${userId}
  `;
  return token;
}
