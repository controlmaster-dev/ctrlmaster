import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateICS } from '@/utils/icsGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);


    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

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

    // Build a schedule object that has an entry for each week
    const fixedParsed = user.schedule ? JSON.parse(user.schedule) : [];
    const tempParsed = user.tempSchedule ? JSON.parse(user.tempSchedule) : {};
    
    const combinedShifts: Record<string, any[]> = {};
    
    // For each week in the range, determine which shifts to use
    for (let i = 0; i < weeksRequested; i++) {
      const currentWeekDate = new Date(startWeekDate + 'T12:00:00');
      currentWeekDate.setDate(currentWeekDate.getDate() + (i * 7));
      
      const year = currentWeekDate.getFullYear();
      const month = String(currentWeekDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentWeekDate.getDate()).padStart(2, '0');
      const weekKey = `${year}-${month}-${d}`;
      
      // If there is an override for this specific week, use it.
      // If tempParsed is an array (legacy), it overrides all weeks.
      // Otherwise, use the permanent schedule (fixedParsed).
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
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}