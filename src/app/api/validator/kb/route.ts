import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const programs = await sql`
      SELECT "code" FROM "ValidProgram" ORDER BY "code" ASC
    `;
    return NextResponse.json(programs.map((p: any) => p.code));
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text;

    if (text === undefined || text === null) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const codes = (text as string)
      .split(/[\n,]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => s.length > 0 && /^[A-Z0-9]+$/.test(s));

    const uniqueCodes = Array.from(new Set(codes));

    await sql.begin(async (tx) => {
      await tx`DELETE FROM "ValidProgram"`;
      if (uniqueCodes.length > 0) {
        for (const code of uniqueCodes) {
          await tx`INSERT INTO "ValidProgram" ("code") VALUES (${code})`;
        }
      }
    });

    return NextResponse.json({ success: true, count: uniqueCodes.length });

  } catch (error) {
    console.error("Error updating knowledge base:", error);
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 });
  }
}
