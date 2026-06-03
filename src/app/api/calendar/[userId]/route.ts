import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateICS } from '@/utils/icsGenerator';
import type { Shift } from '@/lib/types';
import {
  getOrCreateCalendarFeedToken,
  verifyCalendarFeedToken,
} from '@/lib/calendarFeed';
import { validateApiAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

interface CalendarUserRow {
  id: string;
  name: string | null;
  schedule: string | null;
  tempSchedule: string | null;
  calendarFeedToken: string | null;
}

async function authorizeCalendarAccess(
  req: NextRequest,
  userId: string
): Promise<{ ok: true; row: CalendarUserRow } | { ok: false; status: number; message: string }> {
  const [row] = await sql<CalendarUserRow[]>`
    SELECT "id", "name", "schedule", "tempSchedule", "calendarFeedToken"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  if (!row) {
    return { ok: false, status: 404, message: 'User not found' };
  }

  const feedToken = row.calendarFeedToken ?? (await getOrCreateCalendarFeedToken(userId));
  const queryToken = req.nextUrl.searchParams.get('token');

  if (queryToken && feedToken && verifyCalendarFeedToken(queryToken, feedToken)) {
    return { ok: true, row: { ...row, calendarFeedToken: feedToken } };
  }

  const authResult = await validateApiAuth(req);
  if (authResult instanceof NextResponse) {
    return { ok: false, status: 401, message: 'No autorizado' };
  }

  if (String(authResult.user.id) !== userId) {
    return { ok: false, status: 403, message: 'No autorizado para este calendario' };
  }

  return { ok: true, row: { ...row, calendarFeedToken: feedToken } };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const auth = await authorizeCalendarAccess(request, userId);

    if (!auth.ok) {
      return new NextResponse(auth.message, { status: auth.status });
    }

    const userRow = auth.row;
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const d = String(sunday.getDate()).padStart(2, '0');
    const weekStart = `${year}-${month}-${d}`;

    const weeksRequested = Math.min(
      Math.max(parseInt(searchParams.get('weeks') || '4', 10) || 4, 1),
      52
    );
    const startWeekDate = weekStart;

    const fixedParsed = userRow.schedule
      ? (JSON.parse(userRow.schedule) as Shift[])
      : [];
    const tempParsed = userRow.tempSchedule
      ? (JSON.parse(userRow.tempSchedule) as Shift[] | Record<string, Shift[]>)
      : {};

    const combinedShifts: Record<string, Shift[]> = {};

    for (let i = 0; i < weeksRequested; i++) {
      const currentWeekDate = new Date(`${startWeekDate}T12:00:00`);
      currentWeekDate.setDate(currentWeekDate.getDate() + i * 7);

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

    const icsContent = generateICS(
      combinedShifts,
      startWeekDate,
      userRow.name || 'Operador',
      weeksRequested
    );

    const safeName = (userRow.name || 'operador').replace(/[^\w\s-]/g, '').trim() || 'operador';

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="horario_${safeName}.ics"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error generating calendar API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
