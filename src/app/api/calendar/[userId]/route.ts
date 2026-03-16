import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateICS } from '@/utils/icsGenerator';

export async function GET(
  request,
  { params }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;
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


    let shifts: { days: number[]; start: number; end: number }[] | Record<string, { days: number[]; start: number; end: number }[]> = [];
    const sourceSchedule = user.tempSchedule || user.schedule;

    if (sourceSchedule) {
      try {
        const parsed = JSON.parse(sourceSchedule);
        if (Array.isArray(parsed)) {
          shifts = parsed;
        } else if (parsed && typeof parsed === 'object') {


          shifts = parsed;
        } else {
          console.error("Parsed schedule is unknown format:", parsed);
          shifts = [];
        }
      } catch (e) {
        console.error("Error parsing user schedule JSON", e);
        shifts = [];
      }
    }

    const icsContent = generateICS(shifts, weekStart, user.name || 'Operador', weeks);

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