


import { format, parseISO, isValid, startOfDay, endOfDay, startOfWeek, endOfWeek, differenceInDays, differenceInHours, differenceInMinutes, addDays, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Costa_Rica';


const DATE_FORMATS = {
  DATE_ONLY: 'PPP',
  TIME_ONLY: 'p',
  DATE_TIME: 'PPP p',
  DATE_TIME_SHORT: 'dd/MM/yyyy HH:mm',
  TIME_SHORT: 'HH:mm:ss',
  WEEKDAY_SHORT: 'EEEEEE',
} as const;


export function formatDate(date: string | Date, formatStr: string = DATE_FORMATS.DATE_ONLY): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Fecha inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}


export function formatTime(date: string | Date, formatStr: string = DATE_FORMATS.TIME_ONLY): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Hora inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}


export function formatDateTime(date: string | Date, formatStr: string = DATE_FORMATS.DATE_TIME): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Fecha inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}


export function formatShortDate(date: string | Date): string {
  return formatDate(date, DATE_FORMATS.DATE_TIME_SHORT);
}


export function formatWeekday(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Día inválido';
  }

  return format(dateObj, DATE_FORMATS.WEEKDAY_SHORT, {
    locale: es,
  });
}


export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();

  if (!isValid(dateObj)) {
    return 'Fecha inválida';
  }

  const diffInMins = differenceInMinutes(now, dateObj);

  if (diffInMins < 1) {
    return 'ahora mismo';
  }

  if (diffInMins < 60) {
    return `hace ${diffInMins} minuto${diffInMins !== 1 ? 's' : ''}`;
  }

  const diffInHours = differenceInHours(now, dateObj);

  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  }

  const diffInDays = differenceInDays(now, dateObj);

  if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `hace ${months} mes${months !== 1 ? 'es' : ''}`;
  }

  const years = Math.floor(diffInDays / 365);
  return `hace ${years} año${years !== 1 ? 's' : ''}`;
}

export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();

  return (
    isValid(dateObj) &&
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
}

export function isYesterday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const yesterday = addDays(new Date(), -1);

  return (
    isValid(dateObj) &&
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

export function getWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 0 });
}

export function getWeekEnd(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 0 });
}

export function getDayStart(date: string | Date = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

export function getDayEnd(date: string | Date = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

export function parseDate(isoString: string): Date | null {
  const date = parseISO(isoString);
  return isValid(date) ? date : null;
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

export function addHoursToDate(date: Date, hours: number): Date {
  return addHours(date, hours);
}

export function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, -1);
}
