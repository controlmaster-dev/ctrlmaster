import type { ReportStatus } from '@/types/report';
import type { UserRole } from '@/types/auth';
import type { Shift } from '@/lib/types';

export type PaginationDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReportListItemDto = {
  id: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: ReportStatus | string;
  createdAt: string | Date;
  dateStarted: string | Date;
  dateResolved: string | Date | null;
  emailStatus: string;
  emailRecipients: string | null;
  _count: {
    comments: number;
    reactions: number;
  };
};

export type ReportListResponseDto = PaginationDto & {
  reports: ReportListItemDto[];
};

export type UserDto = {
  id: string;
  name: string;
  email?: string;
  username?: string | null;
  role: UserRole | string;
  image?: string | null;
  avatar?: string | null;
  phone?: string | null;
  birthday?: string | null;
  schedule?: string | null;
  tempSchedule?: string | null;
  reportCount?: number;
  isAvailable?: boolean;
  scheduleLabel?: string;
  shifts?: Shift[];
  defaultShifts?: Shift[];
  isTempSchedule?: boolean;
};

export type TaskDto = {
  id: string;
  title: string;
  description?: string | null;
  userId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  deadline?: string | null;
  scheduledDate: string;
  status: 'PENDING' | 'COMPLETED' | 'INCOMPLETE' | string;
  reminderSent?: boolean;
  comment?: string | null;
  completedAt?: string | Date | null;
  createdAt: string | Date;
};
