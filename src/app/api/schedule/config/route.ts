import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const schedule = await sql`
      SELECT ws.*, row_to_json(u.*) AS "user"
      FROM "WeeklySchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
    `;
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule config:', error);
    return NextResponse.json({ error: 'Error fetching schedule config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
