import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    const since = subDays(new Date(), 1);

    const metrics = await sql`
      SELECT * FROM "StreamMetric"
      WHERE "createdAt" >= ${since.toISOString()}
    `;

    const aggregation: Record<string, any> = {};

    metrics.forEach((m: any) => {
      if (!aggregation[m.channel]) {
        aggregation[m.channel] = { name: m.channel, errors: 0, blackScreen: 0, silence: 0 };
      }

      if (m.type === 'ERROR') aggregation[m.channel].errors++;
      if (m.type === 'BLACK_SCREEN') aggregation[m.channel].blackScreen++;
      if (m.type === 'SILENCE') aggregation[m.channel].silence++;
    });

    const result = Object.values(aggregation);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stream stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
