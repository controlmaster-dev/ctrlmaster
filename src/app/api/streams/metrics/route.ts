import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, type, value } = body;

    const [metric] = await sql`
      INSERT INTO "StreamMetric" ("channel", "type", "value")
      VALUES (${channel}, ${type}, ${value || null})
      RETURNING *
    `;

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error saving stream metric:', error);
    return NextResponse.json({ error: 'Failed to save metric' }, { status: 500 });
  }
}
