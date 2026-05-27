import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await sql`
      SELECT se.*,
             (SELECT COUNT(*)::int FROM "SpecialEventShift" ses WHERE ses."eventId" = se."id") AS "shiftCount"
      FROM "SpecialEvent" se
      ORDER BY se."startDate" DESC
    `;

    const mapped = events.map((e: any) => ({
      ...e,
      _count: { shifts: e.shiftCount },
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [event] = await sql`
      INSERT INTO "SpecialEvent" ("name", "startDate", "endDate", "isActive")
      VALUES (${name}, ${startDate}, ${endDate}, TRUE)
      RETURNING *
    `;

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await sql`DELETE FROM "SpecialEvent" WHERE "id" = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, name, startDate, endDate } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const [event] = await sql`
      UPDATE "SpecialEvent"
      SET
        "isActive" = COALESCE(${isActive ?? null}, "isActive"),
        "name" = COALESCE(${name || null}, "name"),
        "startDate" = COALESCE(${startDate || null}, "startDate"),
        "endDate" = COALESCE(${endDate || null}, "endDate")
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
