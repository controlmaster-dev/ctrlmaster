import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { path } = body;
    const userId = authResult.user.id;

    await sql`
      UPDATE "User"
      SET "currentPath" = ${path || null}, "lastActive" = NOW()
      WHERE "id" = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat update failed:', error);
    return NextResponse.json({ error: "Error updating heartbeat" }, { status: 500 });
  }
}
