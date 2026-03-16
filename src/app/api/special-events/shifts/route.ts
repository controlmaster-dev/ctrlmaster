import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    const shifts = await prisma.specialEventShift.findMany({
      where: { eventId },
      include: { user: { select: { name: true, image: true } } }
    });

    return NextResponse.json(shifts);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const body = await req.json();
    const { eventId, userId, shifts } = body;

    if (!eventId || !userId || !Array.isArray(shifts)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {

      await tx.specialEventShift.deleteMany({
        where: {
          eventId,
          userId
        }
      });


      if (shifts.length > 0) {
        await tx.specialEventShift.createMany({
          data: shifts.map((s) => ({
            eventId,
            userId,
            date: s.date,
            start: s.start,
            end: s.end
          }))
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}