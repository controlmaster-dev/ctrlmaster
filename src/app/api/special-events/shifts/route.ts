import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    const shifts = await sql`
      SELECT ses.*,
             json_build_object('name', u."name", 'image', u."image") AS "user"
      FROM "SpecialEventShift" ses
      JOIN "User" u ON u."id" = ses."userId"
      WHERE ses."eventId" = ${eventId}
    `;

    return NextResponse.json(shifts);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const { eventId, userId, shifts } = body;

    if (!eventId || !userId || !Array.isArray(shifts)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM "SpecialEventShift"
        WHERE "eventId" = ${eventId} AND "userId" = ${userId}
      `;

      if (shifts.length > 0) {
        for (const s of shifts) {
          await tx`
            INSERT INTO "SpecialEventShift" ("eventId", "userId", "date", "start", "end")
            VALUES (${eventId}, ${userId}, ${s.date}, ${s.start}, ${s.end})
          `;
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
