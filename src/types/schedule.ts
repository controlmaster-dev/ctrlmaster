


import type { User } from './auth';


export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}


export interface Shift {
  days: DayOfWeek[];
  start: number;
  end: number;
  userId?: string;
  userName?: string;
}


export interface UserSchedule {
  userId: string;
  userName: string;
  shifts: Shift[];
  label: string;
}


export interface WeeklySchedule {
  weekStart: string;
  weekEnd: string;
  schedules: UserSchedule[];
}


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


export interface ShiftReminder {
  userId: string;
  userName: string;
  shiftDate: Date;
  shiftStart: string;
  shiftEnd: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
}


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
