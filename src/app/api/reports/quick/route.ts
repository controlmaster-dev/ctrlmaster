import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { type, description, timestamp } = body;
    const userId = authResult.user.id;

    if (!type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    let user;

    if (userId) {
      [user] = await sql`SELECT * FROM "User" WHERE "id" = ${userId} LIMIT 1`;
    } else {
      [user] = await sql`SELECT * FROM "User" WHERE "role" = 'BOSS' LIMIT 1`;
    }

    if (!user) return NextResponse.json({ error: "No user found to assign report" }, { status: 404 });

    const [newReport] = await sql`
      INSERT INTO "Report" (
        "operatorId", "operatorName", "operatorEmail",
        "problemDescription", "category", "priority",
        "status", "dateStarted"
      )
      VALUES (
        ${user.id}, ${user.name}, ${user.email},
        ${`[ALERTA MONITOR] ${type.replace('_', ' ')}: ${description || 'Sin detalles'}`},
        'INCIDENCIA', 'ALTA', 'PENDIENTE',
        ${new Date(timestamp || new Date()).toISOString()}
      )
      RETURNING *
    `;

    return NextResponse.json(newReport);
  } catch (error: unknown) {
    console.error("Quick Report Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
