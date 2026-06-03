import { formatInTimeZone } from 'date-fns-tz';
import type { Shift } from '@/lib/types';

export const COSTA_RICA_TZ = 'America/Costa_Rica';
const TIMEZONE = COSTA_RICA_TZ;

export function getCostaRicaDateString(date = new Date()): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
}

export function getCostaRicaDayIndex(date = new Date()): number {
  const iso = parseInt(formatInTimeZone(date, TIMEZONE, 'i'), 10);
  return iso === 7 ? 0 : iso;
}

export const WEEK_COLUMNS_MONDAY_FIRST = [
  { label: 'L', dayIdx: 1, name: 'Lunes' },
  { label: 'Ma', dayIdx: 2, name: 'Martes' },
  { label: 'Mi', dayIdx: 3, name: 'Miércoles' },
  { label: 'J', dayIdx: 4, name: 'Jueves' },
  { label: 'V', dayIdx: 5, name: 'Viernes' },
  { label: 'S', dayIdx: 6, name: 'Sábado' },
  { label: 'D', dayIdx: 0, name: 'Domingo' },
] as const;

export function getCurrentDayIndex(): number {
  const iso = parseInt(formatInTimeZone(new Date(), TIMEZONE, 'i'), 10);
  return iso === 7 ? 0 : iso;
}

export function getCurrentHourDecimal(): number {
  const h = parseInt(formatInTimeZone(new Date(), TIMEZONE, 'H'), 10);
  const m = parseInt(formatInTimeZone(new Date(), TIMEZONE, 'm'), 10);
  return h + m / 60;
}

function shiftEndHour(shift: Shift): number {
  return shift.end === 0 ? 24 : shift.end;
}

function isShiftActiveNow(shift: Shift, currentHour: number): boolean {
  const end = shiftEndHour(shift);
  return currentHour >= shift.start && currentHour < end;
}

function isShiftEnded(shift: Shift, currentHour: number): boolean {
  return currentHour >= shiftEndHour(shift);
}

export type TodayShiftCellStatus =
  | 'not-today'
  | 'off'
  | 'active'
  | 'ended'
  | 'upcoming';

export function getTodayShiftCellStatus(
  shifts: Shift[] | undefined,
  dayIdx: number,
  todayIdx: number,
  currentHour: number
): TodayShiftCellStatus {
  if (dayIdx !== todayIdx) return 'not-today';

  const dayShifts = shiftsForDayOfWeek(shifts, dayIdx);
  if (dayShifts.length === 0) return 'off';
  if (dayShifts.some((s) => isShiftActiveNow(s, currentHour))) return 'active';
  if (dayShifts.every((s) => isShiftEnded(s, currentHour))) return 'ended';
  if (dayShifts.some((s) => currentHour < s.start)) return 'upcoming';
  return 'ended';
}

export function shiftsForDayOfWeek(
  shifts: Shift[] | undefined,
  dayIdx: number
): Shift[] {
  if (!shifts?.length) return [];
  return shifts.filter((s) => s.days.includes(dayIdx));
}

export function isDayOff(shifts: Shift[] | undefined, dayIdx: number): boolean {
  return shiftsForDayOfWeek(shifts, dayIdx).length === 0;
}

export function formatShiftRange(
  shift: Shift,
  formatTime: (hour: number) => string
): string {
  const endHour = shift.end === 0 ? 24 : shift.end;
  return `${formatTime(shift.start)}–${formatTime(endHour)}`;
}

export function getWeeklySchemeShifts(
  operator: { shifts?: Shift[]; defaultShifts?: Shift[] }
): Shift[] | undefined {
  if (operator.defaultShifts?.length) {
    return operator.defaultShifts;
  }
  return operator.shifts;
}

export function getHoursUntilNextShift(
  shifts: Shift[] | undefined,
  todayIdx: number,
  currentHour: number
): number | null {
  if (!shifts?.length) return null;

  let best = Infinity;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayIdx = (todayIdx + dayOffset) % 7;
    const dayShifts = shiftsForDayOfWeek(shifts, dayIdx);

    for (const shift of dayShifts) {
      if (dayOffset === 0) {
        if (isShiftActiveNow(shift, currentHour)) return 0;
        if (isShiftEnded(shift, currentHour)) continue;
        if (currentHour < shift.start) {
          best = Math.min(best, shift.start - currentHour);
        }
        continue;
      }

      const hoursUntilDay =
        dayOffset === 1
          ? 24 - currentHour
          : (24 - currentHour) + (dayOffset - 1) * 24;
      best = Math.min(best, hoursUntilDay + shift.start);
    }
  }

  return best === Infinity ? null : best;
}

export function isOperatorActiveNow(
  shifts: Shift[] | undefined,
  todayIdx = getCurrentDayIndex(),
  currentHour = getCurrentHourDecimal()
): boolean {
  return getHoursUntilNextShift(shifts, todayIdx, currentHour) === 0;
}

export function isShiftActiveOnDay(
  shift: Shift,
  columnDayIdx: number,
  todayIdx: number,
  currentHour: number
): boolean {
  if (columnDayIdx !== todayIdx) return false;
  return isShiftActiveNow(shift, currentHour);
}

export type ShiftCardWeekStatus = 'active' | 'upcoming' | 'ended' | 'none';

export interface NextShiftSlot {
  operatorId: string;
  dayIdx: number;
  shiftStart: number;
  shiftEnd: number;
}

function shiftEndForMatch(shift: Shift): number {
  return shift.end === 0 ? 24 : shift.end;
}

export function getHoursUntilShiftOnDay(
  shift: Shift,
  dayIdx: number,
  todayIdx: number,
  currentHour: number
): number | null {
  const dayOffset = (dayIdx - todayIdx + 7) % 7;

  if (dayOffset === 0) {
    if (isShiftActiveNow(shift, currentHour)) return 0;
    if (isShiftEnded(shift, currentHour)) return null;
    if (currentHour < shift.start) return shift.start - currentHour;
    return null;
  }

  const hoursUntilDay =
    dayOffset === 1
      ? 24 - currentHour
      : (24 - currentHour) + (dayOffset - 1) * 24;
  return hoursUntilDay + shift.start;
}

export function getNextShiftSlot(
  operators: Array<{ id: string; shifts?: Shift[] }>,
  todayIdx: number,
  currentHour: number
): NextShiftSlot | null {
  let minHours = Infinity;
  let next: NextShiftSlot | null = null;

  for (const op of operators) {
    if (!op.shifts?.length) continue;

    for (const shift of op.shifts) {
      for (const dayIdx of shift.days) {
        const hours = getHoursUntilShiftOnDay(shift, dayIdx, todayIdx, currentHour);
        if (hours === null || hours <= 0 || hours >= minHours) continue;

        minHours = hours;
        next = {
          operatorId: op.id,
          dayIdx,
          shiftStart: shift.start,
          shiftEnd: shiftEndForMatch(shift),
        };
      }
    }
  }

  return next;
}

function isSameShiftSlot(
  shift: Shift,
  columnDayIdx: number,
  operatorId: string,
  slot: NextShiftSlot
): boolean {
  return (
    slot.operatorId === operatorId &&
    slot.dayIdx === columnDayIdx &&
    slot.shiftStart === shift.start &&
    slot.shiftEnd === shiftEndForMatch(shift)
  );
}

export function getShiftCardWeekStatus(
  shift: Shift,
  columnDayIdx: number,
  operatorId: string,
  todayIdx: number,
  currentHour: number,
  isCurrentRealWeek: boolean,
  nextSlot: NextShiftSlot | null = null
): ShiftCardWeekStatus {
  if (!isCurrentRealWeek) return 'none';

  if (columnDayIdx === todayIdx && isShiftActiveNow(shift, currentHour)) {
    return 'active';
  }

  if (
    nextSlot &&
    isSameShiftSlot(shift, columnDayIdx, operatorId, nextSlot)
  ) {
    return 'upcoming';
  }

  if (columnDayIdx === todayIdx && isShiftEnded(shift, currentHour)) {
    return 'ended';
  }

  return 'none';
}

export interface ShiftProgressStats {
  progress: number;
  remaining: string;
  label: string;
}

export function getActiveShiftProgress(
  shifts: Shift[] | undefined,
  formatTime: (hour: number) => string,
  todayIdx = getCurrentDayIndex(),
  currentHour = getCurrentHourDecimal()
): ShiftProgressStats | null {
  if (!shifts?.length) return null;

  const activeShift = shiftsForDayOfWeek(shifts, todayIdx).find((s) =>
    isShiftActiveNow(s, currentHour)
  );
  if (!activeShift) return null;

  const end = shiftEndHour(activeShift);
  const elapsed = currentHour - activeShift.start;
  const duration = end - activeShift.start;
  if (duration <= 0) return null;

  const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  const remainingHours = end - currentHour;
  const remainingH = Math.floor(remainingHours);
  const remainingM = Math.round((remainingHours - remainingH) * 60);

  return {
    progress,
    remaining: `${remainingH}h ${remainingM}m`,
    label: `${formatTime(activeShift.start)} - ${formatTime(activeShift.end)}`,
  };
}

export function countOperatorsOnDuty(
  operators: Array<{ shifts?: Shift[]; defaultShifts?: Shift[] }>,
  todayIdx = getCurrentDayIndex(),
  currentHour = getCurrentHourDecimal()
): number {
  return operators.filter((op) =>
    isOperatorActiveNow(getWeeklySchemeShifts(op), todayIdx, currentHour)
  ).length;
}

export function formatHoursUntilLabel(hours: number): string {
  if (hours <= 0) return 'Ahora';
  if (hours < 1) return 'En menos de 1h';
  if (hours < 24) return `En ${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.floor(hours % 24);
  return rem > 0 ? `En ${days}d ${rem}h` : `En ${days}d`;
}

export function getNextOperatorId(
  operators: Array<{ id: string; shifts?: Shift[]; defaultShifts?: Shift[] }>,
  todayIdx: number = getCurrentDayIndex(),
  currentHour: number = getCurrentHourDecimal()
): string | null {

  let nextId: string | null = null;
  let minHours = Infinity;

  for (const op of operators) {
    const shifts = getWeeklySchemeShifts(op);
    const hours = getHoursUntilNextShift(shifts, todayIdx, currentHour);
    if (hours !== null && hours > 0 && hours < minHours) {
      minHours = hours;
      nextId = op.id;
    }
  }

  return nextId;
}

export function sortOperatorsByShiftQueue<T extends { id: string; name?: string; shifts?: Shift[]; defaultShifts?: Shift[] }>(
  operators: T[],
  todayIdx: number = getCurrentDayIndex(),
  currentHour: number = getCurrentHourDecimal()
): T[] {

  return [...operators].sort((a, b) => {
    const hoursA = getHoursUntilNextShift(getWeeklySchemeShifts(a), todayIdx, currentHour);
    const hoursB = getHoursUntilNextShift(getWeeklySchemeShifts(b), todayIdx, currentHour);

    if (hoursA === null && hoursB === null) return 0;
    if (hoursA === null) return 1;
    if (hoursB === null) return -1;

    if (hoursA === 0 && hoursB !== 0) return -1;
    if (hoursB === 0 && hoursA !== 0) return 1;

    if (hoursA !== hoursB) return hoursA - hoursB;

    return (a.name ?? '').localeCompare(b.name ?? '', 'es');
  });
}
