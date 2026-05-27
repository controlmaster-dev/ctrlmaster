import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, path } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

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
