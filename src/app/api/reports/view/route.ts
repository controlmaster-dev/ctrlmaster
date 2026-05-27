import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, userId } = body;

    if (!reportId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sql`
      INSERT INTO "ReportView" ("userId", "reportId")
      VALUES (${userId}, ${reportId})
      ON CONFLICT ("userId", "reportId")
      DO UPDATE SET "viewedAt" = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error recording report view:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
