import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET() {
    try {
        // Get metrics for the last 24 hours
        const since = subDays(new Date(), 1);

        const metrics = await prisma.streamMetric.findMany({
            where: {
                createdAt: {
                    gte: since,
                },
            },
        });

        // Aggregate data manually since SQLite group-by support in Prisma can be tricky with specific shapes
        // We want a shape like: { name: "Channel Name", errors: 0, blackScreen: 0, silence: 0 }

        const aggregation: Record<string, { name: string; errors: number; blackScreen: number; silence: number }> = {};

        metrics.forEach((m) => {
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
