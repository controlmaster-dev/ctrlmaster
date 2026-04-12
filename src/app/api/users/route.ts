/**
 * Users API route with input validation and typed error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiError, ValidationError } from '@/lib/errors';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { z } from 'zod';
import { hashPassword } from '@/lib/crypto';
import { Shift } from '@/lib/types';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const TIMEZONE = 'America/Costa_Rica';

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'ENGINEER', 'OPERATOR']).optional().default('OPERATOR'),
  image: z.string().url().optional(),
  birthday: z.string().optional(),
  schedule: z.array(z.any()).optional(),
});

const updateUserSchema = z.object({
  id: z.string().min(1, 'ID de usuario es requerido'),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'ENGINEER', 'OPERATOR']).optional(),
  image: z.string().optional(),
  birthday: z.string().optional(),
  schedule: z.array(z.any()).optional(),
  tempSchedule: z.any().optional(),
  weekStart: z.string().optional(),
});

const deleteUserSchema = z.object({
  id: z.string().min(1, 'ID de usuario es requerido'),
});

const normalize = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function getZonedWeekStart(): string {
  const now = new Date();
  const isoDayStr = formatInTimeZone(now, TIMEZONE, 'i');
  let dayIndex = parseInt(isoDayStr);
  if (dayIndex === 7) dayIndex = 0;

  const zonedNow = toZonedTime(now, TIMEZONE);
  const sunday = new Date(zonedNow);
  sunday.setDate(zonedNow.getDate() - dayIndex);

  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, '0');
  const day = String(sunday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayRangeLabel(days: number[]): string {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const sorted = [...days].sort((a, b) => a - b);

  if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie';
  if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab';
  if (sorted.length === 7) return 'Todos los días';
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem';
  return sorted.map((d) => dayNames[d]).join(',');
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
}

// Legacy fallback schedules (used when user has no DB schedule defined)
const LEGACY_SCHEDULES: Record<string, { shifts: Shift[]; label: string }> = {
  Gabriel: { shifts: [{ days: [0, 1, 2, 3, 4], start: 6, end: 18 }], label: 'Dom-Jue 6am-6pm' },
  Diego: { shifts: [{ days: [1, 2], start: 0, end: 6 }, { days: [3, 4], start: 18, end: 24 }, { days: [6], start: 6, end: 12 }], label: 'Mixto' },
  Alex: { shifts: [{ days: [1, 2, 3, 4, 5], start: 6, end: 15 }], label: 'Lun-Vie 6am-3pm' },
  Andres: { shifts: [{ days: [4, 5, 6, 0, 1], start: 8, end: 18 }], label: 'Jue-Lun 8am-6pm' },
  Josue: { shifts: [{ days: [3, 4, 5, 6, 0], start: 0, end: 6 }], label: 'Mie-Dom 12am-6am' },
  Jeremy: { shifts: [{ days: [5, 6, 0, 1, 2], start: 18, end: 24 }], label: 'Vie-Mar 6pm-12am' },
  Ronald: { shifts: [{ days: [1, 2, 3, 4, 5], start: 8, end: 16 }], label: 'Lun-Vie 8am-4pm' },
};

export async function GET(request: NextRequest) {
  try {
    // Allow unauthenticated GET for public pages like /operadores
    // (no validateApiAuth call here)

    const users = await prisma.user.findMany({
      include: { _count: { select: { reports: true } } },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const now = new Date();
    const dayStr = formatInTimeZone(now, TIMEZONE, 'i');
    let currentDay = parseInt(dayStr);
    if (currentDay === 7) currentDay = 0;

    const currentHour = parseInt(formatInTimeZone(now, TIMEZONE, 'H'));

    const { searchParams } = new URL(request.url);
    const requestedWeekStart = searchParams.get('weekStart');
    const currentWeekStart = requestedWeekStart || getZonedWeekStart();

    const weekEnd = new Date(currentWeekStart);
    if (isNaN(weekEnd.getTime())) weekEnd.setTime(new Date().getTime());
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = isNaN(weekEnd.getTime())
      ? new Date().toISOString().split('T')[0]
      : weekEnd.toISOString().split('T')[0];

    // Fetch active special event if any
    const activeEvent = await prisma.specialEvent.findFirst({
      where: { isActive: true, startDate: { lte: weekEndStr }, endDate: { gte: currentWeekStart } },
    });

    const eventShifts = activeEvent
      ? await prisma.specialEventShift.findMany({ where: { eventId: activeEvent.id } })
      : [];

    const mappedUsers = users.map((user: any) => {
      let isAvailable = false;
      let scheduleLabel = 'Sin horario';
      let shifts: Shift[] = [];
      let isTempSchedule = false;

      // 1. Check special event shifts
      if (activeEvent) {
        const userEventShifts = eventShifts.filter((s: any) => s.userId === user.id);
        if (userEventShifts.length > 0) {
          const currentWeekDate = new Date(currentWeekStart + 'T12:00:00');
          const validShifts = userEventShifts
            .map((s: any) => {
              const shiftDate = new Date(s.date + 'T12:00:00');
              const diffDays = Math.round((shiftDate.getTime() - currentWeekDate.getTime()) / (1000 * 3600 * 24));
              return { ...s, diffDays };
            })
            .filter((s: any) => s.diffDays >= 0 && s.diffDays <= 6);

          if (validShifts.length > 0) {
            shifts = validShifts.map((s: any) => ({ days: [s.diffDays], start: s.start, end: s.end }));
            isTempSchedule = true;
            scheduleLabel = activeEvent.name;
          }
        }
      }

      // 2. Check temp schedule from DB
      if (shifts.length === 0 && user.tempSchedule) {
        try {
          const parsed = JSON.parse(user.tempSchedule);
          if (Array.isArray(parsed) && parsed.length > 0) {
            shifts = parsed;
            isTempSchedule = true;
          } else if (typeof parsed === 'object') {
            const weekShifts = parsed[currentWeekStart];
            if (Array.isArray(weekShifts)) {
              shifts = weekShifts;
              isTempSchedule = true;
            }
          }
        } catch {
          // Ignore malformed JSON
        }
      }

      // 3. Check permanent schedule from DB
      if (!isTempSchedule && shifts.length === 0 && user.schedule) {
        try {
          const parsedShifts = JSON.parse(user.schedule);
          if (Array.isArray(parsedShifts) && parsedShifts.length > 0) shifts = parsedShifts;
        } catch {
          // Ignore malformed JSON
        }
      }

      // 4. Fallback to legacy hardcoded schedules
      if (!isTempSchedule && shifts.length === 0) {
        const key = Object.keys(LEGACY_SCHEDULES).find((k) => normalize(user.name).includes(normalize(k)));
        if (key) shifts = LEGACY_SCHEDULES[key].shifts;
      }

      // Determine availability
      if (shifts.length > 0) {
        const currentShift = shifts.find((shift) => {
          const shiftEnd = shift.end === 0 ? 24 : shift.end;
          return shift.days.includes(currentDay) && currentHour >= shift.start && currentHour < shiftEnd;
        });
        isAvailable = !!currentShift;

        // Build schedule label
        if (isTempSchedule) {
          scheduleLabel = shifts.length === 0
            ? 'Vacaciones'
            : shifts.length === 1
            ? `Temporal (${getDayRangeLabel(shifts[0].days)} ${formatHour(shifts[0].start)}-${formatHour(shifts[0].end)})`
            : `Temporal (${shifts.length} turnos)`;
        } else if (user.schedule && shifts.length > 0) {
          scheduleLabel = shifts.length === 1
            ? `Fijo (${getDayRangeLabel(shifts[0].days)} ${formatHour(shifts[0].start)}-${formatHour(shifts[0].end)})`
            : `Fijo (${shifts.length} turnos)`;
        } else {
          const key = Object.keys(LEGACY_SCHEDULES).find((k) => normalize(user.name).includes(normalize(k)));
          if (key) scheduleLabel = LEGACY_SCHEDULES[key].label;
        }
      } else if (isTempSchedule) {
        scheduleLabel = 'Vacaciones';
      }

      // Build default shifts for calendar display
      let defaultShifts: Shift[] = [];
      if (user.schedule) {
        try {
          const parsed = JSON.parse(user.schedule);
          if (Array.isArray(parsed) && parsed.length > 0) defaultShifts = parsed;
        } catch { /* ignore */ }
      }
      if (defaultShifts.length === 0) {
        const key = Object.keys(LEGACY_SCHEDULES).find((k) => normalize(user.name).includes(normalize(k)));
        if (key) defaultShifts = LEGACY_SCHEDULES[key].shifts;
      }

      const { password: _, ...userInfo } = user;

      return {
        ...userInfo,
        avatar: user.image,
        reportCount: user._count.reports,
        isAvailable,
        scheduleLabel,
        shifts,
        defaultShifts,
        isTempSchedule,
      };
    });

    return NextResponse.json(mappedUsers);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[GET /api/users] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // Only ADMIN and ENGINEER can create users
    const roleResult = requireRole(authResult.user, ['ADMIN', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { name, email, password, role, image, birthday, schedule } = result.data;

    // Hash password before storing
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        image: image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        birthday,
        schedule: schedule ? JSON.stringify(schedule) : null,
      },
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/users] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // Only ADMIN and ENGINEER can update users
    const roleResult = requireRole(authResult.user, ['ADMIN', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { id, name, email, role, image, birthday, schedule, tempSchedule, weekStart } = result.data;

    let finalTempScheduleString: string | undefined = undefined;

    if (tempSchedule !== undefined) {
      const currentUser = await prisma.user.findUnique({ where: { id }, select: { tempSchedule: true } });
      let scheduleMap: Record<string, Shift[]> = {};

      if (currentUser?.tempSchedule) {
        try {
          const parsed = JSON.parse(currentUser.tempSchedule);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            scheduleMap = parsed;
          }
        } catch { /* ignore */ }
      }

      if (weekStart && tempSchedule) {
        scheduleMap[weekStart] = tempSchedule;
      } else if (tempSchedule === null && weekStart) {
        delete scheduleMap[weekStart];
      } else if (tempSchedule === null && !weekStart) {
        scheduleMap = {};
      }

      finalTempScheduleString = JSON.stringify(scheduleMap);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role: role as any,
        image,
        birthday,
        schedule: schedule ? JSON.stringify(schedule) : undefined,
        tempSchedule: finalTempScheduleString !== undefined ? finalTempScheduleString : undefined,
      },
    });

    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[PATCH /api/users] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // Only ADMIN can delete users
    const roleResult = requireRole(authResult.user, ['ADMIN']);
    if (roleResult instanceof NextResponse) return roleResult;

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    const result = deleteUserSchema.safeParse({ id: idParam });
    if (!result.success) {
      throw new ValidationError('ID de usuario inválido', result.error.issues);
    }

    await prisma.user.delete({ where: { id: result.data.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[DELETE /api/users] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}