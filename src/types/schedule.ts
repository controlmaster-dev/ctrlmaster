/**
 * Schedule and shift types
 */

import type { User } from './auth';

/**
 * Day of week enum (0 = Sunday, 6 = Saturday)
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Shift interface
 */
export interface Shift {
  days: DayOfWeek[];
  start: number; // Hour in 24h format (0-23)
  end: number; // Hour in 24h format (0-23)
  userId?: string;
  userName?: string;
}

/**
 * Schedule configuration for a user
 */
export interface UserSchedule {
  userId: string;
  userName: string;
  shifts: Shift[];
  label: string;
}

/**
 * Weekly schedule data
 */
export interface WeeklySchedule {
  weekStart: string;
  weekEnd: string;
  schedules: UserSchedule[];
}

/**
 * Special event interface
 */
export interface SpecialEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isRecurring?: boolean;
  recurringPattern?: string;
  affectedUsers?: string[];
}

/**
 * Shift reminder data
 */
export interface ShiftReminder {
  userId: string;
  userName: string;
  shiftDate: Date;
  shiftStart: string;
  shiftEnd: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
}

/**
 * Calendar event interface
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'shift' | 'special-event' | 'reminder';
  userId?: string;
  userName?: string;
  description?: string;
}
