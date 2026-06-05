


export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
}


export enum ReportPriority {
  ENLACE = 'Enlace',
  EJTV = 'EJTV',
  ENLACE_USA = 'Enlace USA',
  TODOS = 'Todos',
}


export enum ReportCategory {
  TRANSMISSION = 'Transmisión',
  AUDIO = 'Audio',
  VIDEO = 'Video',
  EQUIPMENT = 'Equipos',
  SOFTWARE = 'Software',
  POWER_FAILURE = 'Falla Energética',
  OTHER = 'Otros',
}


export enum EmailStatus {
  NONE = 'none',
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}


export interface Report {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: ReportStatus;
  dateStarted: Date;
  dateResolved?: Date | null;
  emailStatus: EmailStatus;
  emailRecipients?: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments?: Attachment[];
  comments?: Comment[];
  reactions?: Reaction[];
  _count?: {
    comments: number;
    reactions: number;
  };
}


export interface Attachment {
  id: string;
  reportId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  data?: string;
  createdAt: Date;
}


export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface Reaction {
  id: string;
  reportId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}


export interface CreateReportRequest {
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: ReportStatus;
  dateStarted: string;
  dateResolved?: string | null;
  emailStatus?: EmailStatus;
  emailRecipients?: string | null;
  attachments?: AttachmentInput[];
}


export interface AttachmentInput {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  data?: string;
}


export interface UpdateReportRequest {
  id: string;
  status?: ReportStatus;
  dateResolved?: Date | null;
}


export interface ReportListOptions {
  status?: ReportStatus;
  priority?: string;
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}


export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  criticalReports: number;
  reportsToday: number;
  averageResolutionTime: number;
}


export interface ChartDataPoint {
  label: string;
  value: number;
}


export interface ChartData {
  labels: string[];
  values: number[];
}
