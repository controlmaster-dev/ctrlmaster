import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateICS } from '@/utils/icsGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);

    const [user] = await sql`
      SELECT * FROM "User" WHERE "id" = ${userId} LIMIT 1
    `;

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const d = String(sunday.getDate()).padStart(2, '0');
    const weekStart = `${year}-${month}-${d}`;

    const weeksRequested = parseInt(searchParams.get('weeks') || '4', 10);
    const startWeekDate = weekStart;

    const fixedParsed = user.schedule ? JSON.parse(user.schedule) : [];
    const tempParsed = user.tempSchedule ? JSON.parse(user.tempSchedule) : {};

    const combinedShifts: Record<string, any[]> = {};

    for (let i = 0; i < weeksRequested; i++) {
      const currentWeekDate = new Date(startWeekDate + 'T12:00:00');
      currentWeekDate.setDate(currentWeekDate.getDate() + (i * 7));

      const y = currentWeekDate.getFullYear();
      const m = String(currentWeekDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentWeekDate.getDate()).padStart(2, '0');
      const weekKey = `${y}-${m}-${dd}`;

      if (Array.isArray(tempParsed)) {
        combinedShifts[weekKey] = tempParsed;
      } else if (tempParsed[weekKey]) {
        combinedShifts[weekKey] = tempParsed[weekKey];
      } else {
        combinedShifts[weekKey] = Array.isArray(fixedParsed) ? fixedParsed : [];
      }
    }

    const icsContent = generateICS(combinedShifts, startWeekDate, user.name || 'Operador', weeksRequested);

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="horario_${user.name}.ics"`
      }
    });

  } catch (error) {
    console.error('Error generating calendar API:', error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 }
    );
  }
}
