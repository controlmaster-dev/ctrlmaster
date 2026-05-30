import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { subDays } from 'date-fns';
import { validateApiAuth } from '@/lib/apiAuth';

interface StreamStatsRow {
  channel: string;
  errors: number;
  blackScreen: number;
  silence: number;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const since = subDays(new Date(), 1);


    const rows = await sql`
      SELECT "channel",
             COUNT(*) FILTER (WHERE "type" = 'ERROR')::int AS "errors",
             COUNT(*) FILTER (WHERE "type" = 'BLACK_SCREEN')::int AS "blackScreen",
             COUNT(*) FILTER (WHERE "type" = 'SILENCE')::int AS "silence"
      FROM "StreamMetric"
      WHERE "createdAt" >= ${since.toISOString()}
      GROUP BY "channel"
    `;

    const result = (rows as unknown as StreamStatsRow[]).map((r) => ({
      name: r.channel,
      errors: r.errors,
      blackScreen: r.blackScreen,
      silence: r.silence,
    }));

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  } catch (error) {
    console.error('Error fetching stream stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
