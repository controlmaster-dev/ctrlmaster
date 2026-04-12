/**
 * Common TypeScript interfaces and types for CtrlMaster
 */

export type UserRole = 'ADMIN' | 'ENGINEER' | 'OPERATOR' | 'BOSS';

export interface Shift {
  days: number[];
  start: number;
  end: number;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  role: UserRole | string;
  shifts?: Shift[];
  isTempSchedule?: boolean;
  tempSchedule?: string | null;
  schedule?: string | null;
}

export interface WeekDate {
  name: string;
  dateStr: string;
  fullDate: string;
}

export interface DayColumn {
  dateLabel: string;
  dayIndex: number;
  shifts: Array<{
    op: Operator;
    shift: Shift;
    shiftIndex: number;
  }>;
}

export interface EditingState {
  originalOpId: string;
  dayIndex: number;
  shifts: Array<Shift & { targetOpId: string; tempId: string }>;
}

export interface WeeklyCalendarProps {
  operators: Operator[];
  onUpdateSchedule?: (userId: string, shifts: Shift[], weekStart: string) => Promise<void> | void;
  currentWeekStart: string;
  onWeekChange?: (weekStart: string) => void;
  isLoading?: boolean;
  onEditUser?: (user: Operator) => void;
}
