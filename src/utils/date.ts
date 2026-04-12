/**
 * Date formatting utilities
 */

import { format, parseISO, isValid, startOfDay, endOfDay, startOfWeek, endOfWeek, differenceInDays, differenceInHours, differenceInMinutes, addDays, addHours, addMinutes } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Costa_Rica';

// Date format constants
const DATE_FORMATS = {
  DATE_ONLY: 'PPP',
  TIME_ONLY: 'p',
  DATE_TIME: 'PPP p',
  DATE_TIME_SHORT: 'dd/MM/yyyy HH:mm',
  TIME_SHORT: 'HH:mm:ss',
  WEEKDAY_SHORT: 'EEEEEE',
} as const;

/**
 * Format a date to display format
 * 
 * @param date - Date to format
 * @param formatStr - Format string (optional)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatStr: string = DATE_FORMATS.DATE_ONLY): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Fecha inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}

/**
 * Format a time to display format
 * 
 * @param date - Date to format
 * @param formatStr - Format string (optional)
 * @returns Formatted time string
 */
export function formatTime(date: string | Date, formatStr: string = DATE_FORMATS.TIME_ONLY): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Hora inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}

/**
 * Format a date and time to display format
 * 
 * @param date - Date to format
 * @param formatStr - Format string (optional)
 * @returns Formatted date-time string
 */
export function formatDateTime(date: string | Date, formatStr: string = DATE_FORMATS.DATE_TIME): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Fecha inválida';
  }

  return formatInTimeZone(dateObj, TIMEZONE, formatStr, {
    locale: es,
  });
}

/**
 * Format a date to short format
 * 
 * @param date - Date to format
 * @returns Formatted short date string
 */
export function formatShortDate(date: string | Date): string {
  return formatDate(date, DATE_FORMATS.DATE_TIME_SHORT);
}

/**
 * Format a weekday name
 * 
 * @param date - Date to format
 * @returns Formatted weekday name
 */
export function formatWeekday(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Día inválido';
  }

  return format(dateObj, DATE_FORMATS.WEEKDAY_SHORT, {
    locale: es,
  });
}

/**
 * Get relative time string (e.g., "hace 5 minutos")
 * 
 * @param date - Date to compare
 * @returns Relative time string
 */
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

/**
 * Check if a Date is today
 * 
 * @param date - Date to check
 * @returns True if date is today
 */
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

/**
 * Check if a Date is yesterday
 * 
 * @param date - Date to check
 * @returns True if date is yesterday
 */
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

/**
 * Get start of current week
 * 
 * @returns Start of week date
 */
export function getWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 0 });
}

/**
 * Get end of current week
 * 
 * @returns End of week date
 */
export function getWeekEnd(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 0 });
}

/**
 * Get start of current day
 * 
 * @param date - Date to format
 * @returns Start of day date
 */
export function getDayStart(date: string | Date = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of current day
 * 
 * @returns End of day date
 */
export function getDayEnd(date: string | Date = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Parse an ISO date string to Date object
 * 
 * @param isoString - ISO date string
 * @returns Date object or null if invalid
 */
export function parseDate(isoString: string): Date | null {
  const date = parseISO(isoString);
  return isValid(date) ? date : null;
}

/**
 * Format a date to ISO string
 * 
 * @param date - Date to format
 * @returns ISO date string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Add days to a date
 * 
 * @param date - Date to add days to
 * @param days - Number of days to add
 * @returns New date
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Add hours to a date
 * 
 * @param date - Date to add hours to
 * @param hours - Number of hours to add
 * @returns New date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  return addHours(date, hours);
}

/**
 * Add minutes to a date
 * 
 * @param date - Date to add minutes to
 * @param minutes - Number of minutes to add
 * @returns New date
 */
/**
 * Get date string in local ISO format
 * 
 * @param date - Date to format
 * @returns Local ISO date string
 */
export function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, -1);
}
