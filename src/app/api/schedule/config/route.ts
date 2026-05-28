import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const schedule = await sql`
      SELECT ws.*, json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS "user"
      FROM "WeeklySchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
    `;
    return NextResponse.json(schedule, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error) {
    console.error('Error fetching schedule config:', error);
    return NextResponse.json({ error: 'Error fetching schedule config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    if (schedule.length > 0) {
      await sql.begin(async (tx) => {
        for (const item of schedule) {
          if (item.userId === "REMOVE") {
            await tx`DELETE FROM "WeeklySchedule" WHERE "dayOfWeek" = ${item.dayOfWeek}`;
          } else {
            await tx`
              INSERT INTO "WeeklySchedule" ("dayOfWeek", "userId")
              VALUES (${item.dayOfWeek}, ${item.userId})
              ON CONFLICT ("dayOfWeek")
              DO UPDATE SET "userId" = EXCLUDED."userId"
            `;
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving schedule:", error);
    return NextResponse.json({ error: 'Error saving schedule' }, { status: 500 });
  }
}
