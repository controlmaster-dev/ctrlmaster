import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const dynamic = 'force-dynamic';

const TIMEZONE = 'America/Costa_Rica';


const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function getZonedWeekStart() {
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
  const result = `${year}-${month}-${day}`;

  return result;
}

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { reports: true }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }]

    });
    const schedules = {
      'Gabriel': {
        shifts: [{ days: [0, 1, 2, 3, 4], start: 6, end: 18 }],
        label: 'Dom-Jue 6am-6pm'
      },
      'Diego': {
        shifts: [
          { days: [1, 2], start: 0, end: 6 },
          { days: [3, 4], start: 18, end: 24 },
          { days: [6], start: 6, end: 12 }],

        label: 'Mixto (Lun-Mar Madrugada, Mie-Jue Tarde, Sab Mañana)'
      },
      'Alex': {
        shifts: [{ days: [1, 2, 3, 4, 5], start: 6, end: 15 }],
        label: 'Lun-Vie 6am-3pm'
      },
      'Andres': {
        shifts: [{ days: [4, 5, 6, 0, 1], start: 8, end: 18 }],
        label: 'Jue-Lun 8am-6pm'
      },
      'Josue': {
        shifts: [{ days: [3, 4, 5, 6, 0], start: 0, end: 6 }],
        label: 'Mie-Dom 12am-6am'
      },
      'Jeremy': {
        shifts: [{ days: [5, 6, 0, 1, 2], start: 18, end: 24 }],
        label: 'Vie-Mar 6pm-12am'
      },
      'Ronald': {
        shifts: [{ days: [1, 2, 3, 4, 5], start: 8, end: 16 }],
        label: 'Lun-Vie 8am-4pm'
      }
    };


    const now = new Date();


    const dayStr = formatInTimeZone(now, TIMEZONE, 'i');
    let currentDay = parseInt(dayStr);
    if (currentDay === 7) currentDay = 0;


    const hourStr = formatInTimeZone(now, TIMEZONE, 'H');
    const currentHour = parseInt(hourStr);

    const { searchParams } = new URL(request.url);
    const requestedWeekStart = searchParams.get('weekStart');

    const currentWeekStart = requestedWeekStart || getZonedWeekStart();





    const weekEnd = new Date(currentWeekStart);
    if (isNaN(weekEnd.getTime())) {

      weekEnd.setTime(new Date().getTime());
    }
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = isNaN(weekEnd.getTime()) ? new Date().toISOString().split('T')[0] : weekEnd.toISOString().split('T')[0];

    const activeEvent = await prisma.specialEvent.findFirst({
      where: {
        isActive: true,
        startDate: { lte: weekEndStr },
        endDate: { gte: currentWeekStart }
      }
    });

    let eventShifts = [];
    if (activeEvent) {
      eventShifts = await prisma.specialEventShift.findMany({
        where: { eventId: activeEvent.id }
      });
    }

    const mappedUsers = users.map((user) => {
      let isAvailable = false;
      let scheduleLabel = 'Sin horario';
      let shifts = [];
      let isTempSchedule = false;




      if (activeEvent) {

        const userEventShifts = eventShifts.filter((s) => s.userId === user.id);

        if (userEventShifts.length > 0) {

          const currentWeekDate = new Date(currentWeekStart + 'T12:00:00');

          const validShifts = userEventShifts.map((s) => {
            const shiftDate = new Date(s.date + 'T12:00:00');
            const diffTime = shiftDate.getTime() - currentWeekDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

            return { ...s, diffDays };
          }).filter((s) => s.diffDays >= 0 && s.diffDays <= 6);

          if (validShifts.length > 0) {
            shifts = validShifts.map((s) => ({
              days: [s.diffDays],
              start: s.start,
              end: s.end
            }));
            isTempSchedule = true;
            scheduleLabel = activeEvent.name;
          }
        }
      }



      if (shifts.length === 0 && user.tempSchedule) {
        try {
          const parsed = JSON.parse(user.tempSchedule);

          if (Array.isArray(parsed)) {

            shifts = parsed;
            isTempSchedule = true;
          } else if (typeof parsed === 'object') {
            const weekShifts = parsed[currentWeekStart];
            if (Array.isArray(weekShifts)) {
              shifts = weekShifts;
              isTempSchedule = true;
            }
          }
        } catch (e) {
          console.error("Error parsing temp schedule", e);
        }
      }


      if (!isTempSchedule && shifts.length === 0 && user.schedule) {
        try {
          const parsedShifts = JSON.parse(user.schedule);
          if (parsedShifts.length > 0) {
            shifts = parsedShifts;
          }
        } catch (e) {
          console.error("Error parsing schedule for user", user.name, e);
        }
      }


      if (!isTempSchedule && shifts.length === 0) {
        const scheduleKey = Object.keys(schedules).find((key) => normalize(user.name).includes(normalize(key)));
        if (scheduleKey) {
          const s = schedules[scheduleKey];
          shifts = s.shifts;
        }
      }


      if (shifts.length > 0) {
        const currentShift = shifts.find((shift) => {

          const shiftEnd = shift.end === 0 ? 24 : shift.end;
          return shift.days.includes(currentDay) &&
            currentHour >= shift.start &&
            currentHour < shiftEnd;
        });
        isAvailable = !!currentShift;


        if (isTempSchedule) {
          if (shifts.length === 0) {
            scheduleLabel = 'Vacaciones';
          } else if (shifts.length === 1) {
            const shift = shifts[0];
            scheduleLabel = `Temporal (${getDayRangeLabel(shift.days)} ${formatTime(shift.start)}-${formatTime(shift.end)})`;
          } else {
            scheduleLabel = 'Temporal' + ` (${shifts.length} turnos)`;
          }
        } else if (user.schedule && shifts.length > 0) {

          scheduleLabel = 'Fijo';
          if (shifts.length === 1) {
            const shift = shifts[0];
            scheduleLabel = `Fijo (${getDayRangeLabel(shift.days)} ${formatTime(shift.start)}-${formatTime(shift.end)})`;
          } else {
            scheduleLabel += ` (${shifts.length} turnos)`;
          }
        } else {

          const scheduleKey = Object.keys(schedules).find((key) => normalize(user.name).includes(normalize(key)));
          if (scheduleKey) {
            scheduleLabel = schedules[scheduleKey].label;
          }
        }
      } else if (isTempSchedule) {
        scheduleLabel = 'Vacaciones';
      }


      let defaultShifts = [];
      if (user.schedule) {
        try {
          const parsed = JSON.parse(user.schedule);
          if (parsed.length > 0) defaultShifts = parsed;
        } catch (e) { }
      }


      if (defaultShifts.length === 0) {
        const scheduleKey = Object.keys(schedules).find((key) => normalize(user.name).includes(normalize(key)));
        if (scheduleKey) {
          defaultShifts = schedules[scheduleKey].shifts;
        }
      }

      return {
        ...user,
        avatar: user.image,
        reportCount: user._count.reports,
        isAvailable,
        scheduleLabel,
        schedule: undefined,
        tempSchedule: undefined,
        shifts: shifts,
        defaultShifts,
        isTempSchedule,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        lastLoginCountry: user.lastLoginCountry,
        currentPath: user.currentPath,
        lastActive: user.lastActive
      };
    });

    return NextResponse.json(mappedUsers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


function getDayRangeLabel(days) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];


  const sorted = [...days].sort((a, b) => a - b);


  if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie';
  if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab';
  if (sorted.length === 7) return 'Todos los días';
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem';


  return sorted.map((d) => dayNames[d]).join(',');
}

function formatTime(hour) {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, name, email, role, schedule, image, birthday } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });


    let finalTempScheduleString = undefined;

    if (body.tempSchedule !== undefined) {

      const currentUser = await prisma.user.findUnique({ where: { id: body.id }, select: { tempSchedule: true } });

      let scheduleMap: Record<string, { days: number[], start: number, end: number }[]> = {};
      if (currentUser?.tempSchedule) {
        try {
          const parsed = JSON.parse(currentUser.tempSchedule);
          if (Array.isArray(parsed)) {



          } else {
            scheduleMap = parsed;
          }
        } catch (e) { }
      }

      if (body.weekStart && body.tempSchedule) {

        scheduleMap[body.weekStart] = body.tempSchedule;
      } else if (body.tempSchedule === null && body.weekStart) {

        delete scheduleMap[body.weekStart];
      } else if (body.tempSchedule === null && !body.weekStart) {

        scheduleMap = {};
      }

      finalTempScheduleString = JSON.stringify(scheduleMap);
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: {
        name,
        email,
        role,
        image,
        birthday,
        schedule: schedule ? JSON.stringify(schedule) : undefined,
        tempSchedule: finalTempScheduleString !== undefined ? finalTempScheduleString : undefined
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role, image, schedule, birthday } = body;


    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || 'OPERATOR',
        image: image || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
        birthday,
        schedule: schedule ? JSON.stringify(schedule) : null
      }
    });
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}