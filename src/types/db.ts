


export interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  password: string;
  phone: string | null;
  role: string;
  lastLogin: string | null;
  lastLoginIP: string | null;
  lastLoginCountry: string | null;
  currentPath: string | null;
  lastActive: string | null;
  image: string | null;
  birthday: string | null;
  schedule: string | null;
  tempSchedule: string | null;
  calendarFeedToken: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: string;
  dateStarted: string;
  dateResolved: string | null;
  emailStatus: string;
  emailRecipients: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportView {
  id: string;
  userId: string;
  reportId: string;
  viewedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  reportId: string;
  parentId: string | null;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  emoji: string;
  authorId: string;
  commentId: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  authorId: string;
  reportId: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  url: string;
  type: string;
  data: string | null;
  reportId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  priority: string;
  deadline: string | null;
  scheduledDate: string;
  status: string;
  reminderSent: boolean;
  comment: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkSchedule {
  id: string;
  date: string;
  userId: string;
  isOverride: boolean;
}

export interface StreamMetric {
  id: string;
  channel: string;
  type: string;
  value: number | null;
  createdAt: string;
}

export interface ValidProgram {
  id: string;
  code: string;
  createdAt: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SpecialEventShift {
  id: string;
  eventId: string;
  userId: string;
  date: string;
  start: number;
  end: number;
}

export interface WeeklySchedule {
  id: string;
  dayOfWeek: number;
  userId: string;
}

export interface Credential {
  id: string;
  service: string;
  category: string;
  username: string;
  password: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationCode {
  id: string;
  code: string;
  createdById: string;
  usedById: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface SessionToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}
