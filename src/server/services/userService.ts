import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { hashPassword } from '@/lib/crypto';
import type { Shift } from '@/lib/types';
import {
  countReportsByUser,
  createUser,
  deleteUser,
  findActiveSpecialEvent,
  getUserTempSchedule,
  listSpecialEventShifts,
  listUsers,
  updateUser,
  type CreateUserData,
  type SpecialEventRow,
  type SpecialEventShiftRow,
  type UpdateUserData,
  type UserRow,
} from '@/server/repositories/userRepository';

const TIMEZONE = 'America/Costa_Rica';

const SENSITIVE_USER_FIELDS = [
  'email',
  'phone',
  'lastLogin',
  'lastLoginIP',
  'lastLoginCountry',
  'currentPath',
  'lastActive',
] as const;

const LEGACY_SCHEDULES: Record<string, { shifts: Shift[]; label: string }> = {
  Gabriel: { shifts: [{ days: [0, 1, 2, 3, 4], start: 6, end: 18 }], label: 'Dom-Jue 6am-6pm' },
  Diego: { shifts: [{ days: [1, 2], start: 0, end: 6 }, { days: [3, 4], start: 18, end: 24 }, { days: [6], start: 6, end: 12 }], label: 'Mixto' },
  Alex: { shifts: [{ days: [1, 2, 3, 4, 5], start: 6, end: 15 }], label: 'Lun-Vie 6am-3pm' },
  Andres: { shifts: [{ days: [4, 5, 6, 0, 1], start: 8, end: 18 }], label: 'Jue-Lun 8am-6pm' },
  Josue: { shifts: [{ days: [3, 4, 5, 6, 0], start: 0, end: 6 }], label: 'Mie-Dom 12am-6am' },
  Jeremy: { shifts: [{ days: [5, 6, 0, 1, 2], start: 18, end: 24 }], label: 'Vie-Mar 6pm-12am' },
  Ronald: { shifts: [{ days: [1, 2, 3, 4, 5], start: 8, end: 16 }], label: 'Lun-Vie 8am-4pm' },
};

type UsersDirectoryOptions = {
  weekStart?: string;
  isAuthenticated: boolean;
};

type UpdateUserScheduleInput = Omit<UpdateUserData, 'tempSchedule'> & {
  tempSchedule?: Shift[] | null;
  weekStart?: string;
};

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

function getWeekEnd(weekStart: string) {
  const weekEnd = new Date(weekStart);
  if (isNaN(weekEnd.getTime())) weekEnd.setTime(new Date().getTime());
  weekEnd.setDate(weekEnd.getDate() + 6);
  return isNaN(weekEnd.getTime())
    ? new Date().toISOString().split('T')[0]
    : weekEnd.toISOString().split('T')[0];
}

function getDayRangeLabel(days: number[]): string {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const sorted = [...days].sort((a, b) => a - b);

  if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie';
  if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab';
  if (sorted.length === 7) return 'Todos los dias';
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem';
  return sorted.map((d) => dayNames[d]).join(',');
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
}

function parseShiftList(value: string | null): Shift[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTempSchedule(value: string | null, weekStart: string) {
  if (!value) return { shifts: [] as Shift[], isTempSchedule: false };
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { shifts: parsed as Shift[], isTempSchedule: true };
    }
    if (parsed && typeof parsed === 'object') {
      const weekShifts = (parsed as Record<string, Shift[]>)[weekStart];
      if (Array.isArray(weekShifts)) {
        return { shifts: weekShifts, isTempSchedule: true };
      }
    }
  } catch {
    return { shifts: [] as Shift[], isTempSchedule: false };
  }

  return { shifts: [] as Shift[], isTempSchedule: false };
}

function legacyScheduleFor(name: string) {
  const key = Object.keys(LEGACY_SCHEDULES).find((item) => normalize(name).includes(normalize(item)));
  return key ? LEGACY_SCHEDULES[key] : null;
}

function eventShiftsForUser(
  user: UserRow,
  event: SpecialEventRow | null,
  shifts: SpecialEventShiftRow[],
  weekStart: string
) {
  if (!event) return null;

  const userEventShifts = shifts.filter((shift) => shift.userId === user.id);
  if (userEventShifts.length === 0) return null;

  const currentWeekDate = new Date(`${weekStart}T12:00:00`);
  const validShifts = userEventShifts
    .map((shift) => {
      const shiftDate = new Date(`${shift.date}T12:00:00`);
      const diffDays = Math.round((shiftDate.getTime() - currentWeekDate.getTime()) / (1000 * 3600 * 24));
      return { ...shift, diffDays };
    })
    .filter((shift) => shift.diffDays >= 0 && shift.diffDays <= 6);

  if (validShifts.length === 0) return null;

  return {
    shifts: validShifts.map((shift) => ({ days: [shift.diffDays], start: shift.start, end: shift.end })),
    scheduleLabel: event.name,
  };
}

function redactPublicUser<T extends Record<string, unknown>>(user: T, isAuthenticated: boolean) {
  if (isAuthenticated) return user;
  const redacted = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete redacted[field];
  }
  return redacted;
}

function mapUserDirectoryItem(
  user: UserRow,
  reportCounts: Record<string, number>,
  currentDay: number,
  currentHour: number,
  weekStart: string,
  activeEvent: SpecialEventRow | null,
  eventShifts: SpecialEventShiftRow[],
  isAuthenticated: boolean
) {
  let isAvailable = false;
  let scheduleLabel = 'Sin horario';
  let shifts: Shift[] = [];
  let isTempSchedule = false;

  const eventSchedule = eventShiftsForUser(user, activeEvent, eventShifts, weekStart);
  if (eventSchedule) {
    shifts = eventSchedule.shifts;
    scheduleLabel = eventSchedule.scheduleLabel;
    isTempSchedule = true;
  }

  if (shifts.length === 0) {
    const temp = parseTempSchedule(user.tempSchedule, weekStart);
    shifts = temp.shifts;
    isTempSchedule = temp.isTempSchedule;
  }

  if (!isTempSchedule && shifts.length === 0) {
    shifts = parseShiftList(user.schedule);
  }

  if (!isTempSchedule && shifts.length === 0) {
    shifts = legacyScheduleFor(user.name)?.shifts ?? [];
  }

  if (shifts.length > 0) {
    const currentShift = shifts.find((shift) => {
      const shiftEnd = shift.end === 0 ? 24 : shift.end;
      return shift.days.includes(currentDay) && currentHour >= shift.start && currentHour < shiftEnd;
    });
    isAvailable = !!currentShift;

    if (isTempSchedule) {
      scheduleLabel = shifts.length === 1
        ? `Temporal (${getDayRangeLabel(shifts[0].days)} ${formatHour(shifts[0].start)}-${formatHour(shifts[0].end)})`
        : `Temporal (${shifts.length} turnos)`;
    } else if (user.schedule) {
      scheduleLabel = shifts.length === 1
        ? `Fijo (${getDayRangeLabel(shifts[0].days)} ${formatHour(shifts[0].start)}-${formatHour(shifts[0].end)})`
        : `Fijo (${shifts.length} turnos)`;
    } else {
      scheduleLabel = legacyScheduleFor(user.name)?.label ?? scheduleLabel;
    }
  } else if (isTempSchedule) {
    scheduleLabel = 'Vacaciones';
  }

  let defaultShifts = parseShiftList(user.schedule);
  if (defaultShifts.length === 0) {
    defaultShifts = legacyScheduleFor(user.name)?.shifts ?? [];
  }

  return redactPublicUser(
    {
      ...user,
      avatar: user.image,
      reportCount: reportCounts[user.id] || 0,
      isAvailable,
      scheduleLabel,
      shifts,
      defaultShifts,
      isTempSchedule,
    },
    isAuthenticated
  );
}

export async function getUsersDirectory(options: UsersDirectoryOptions) {
  const users = await listUsers();
  const reportCounts = await countReportsByUser(users.map((user) => user.id));
  const now = new Date();
  const currentDayRaw = parseInt(formatInTimeZone(now, TIMEZONE, 'i'));
  const currentDay = currentDayRaw === 7 ? 0 : currentDayRaw;
  const currentHour = parseInt(formatInTimeZone(now, TIMEZONE, 'H'));
  const currentWeekStart = options.weekStart || getZonedWeekStart();
  const activeEvent = await findActiveSpecialEvent(currentWeekStart, getWeekEnd(currentWeekStart));
  const eventShifts = activeEvent ? await listSpecialEventShifts(activeEvent.id) : [];

  return users.map((user) =>
    mapUserDirectoryItem(
      user,
      reportCounts,
      currentDay,
      currentHour,
      currentWeekStart,
      activeEvent,
      eventShifts,
      options.isAuthenticated
    )
  );
}

export async function createUserAccount(data: CreateUserData) {
  return createUser({
    ...data,
    password: await hashPassword(data.password),
  });
}

export async function updateUserAccount(data: UpdateUserScheduleInput) {
  let finalTempScheduleString: string | undefined;

  if (data.tempSchedule !== undefined) {
    const currentTempSchedule = await getUserTempSchedule(data.id);
    let scheduleMap: Record<string, Shift[]> = {};

    try {
      const parsed = currentTempSchedule ? JSON.parse(currentTempSchedule) : null;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        scheduleMap = parsed;
      }
    } catch {
      scheduleMap = {};
    }

    if (data.weekStart && data.tempSchedule) {
      scheduleMap[data.weekStart] = data.tempSchedule;
    } else if (data.tempSchedule === null && data.weekStart) {
      delete scheduleMap[data.weekStart];
    } else if (data.tempSchedule === null && !data.weekStart) {
      scheduleMap = {};
    }

    finalTempScheduleString = JSON.stringify(scheduleMap);
  }

  return updateUser({
    ...data,
    tempSchedule: finalTempScheduleString,
  });
}

export async function deleteUserAccount(id: string) {
  await deleteUser(id);
  return { success: true };
}
