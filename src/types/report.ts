/**
 * Report and incident types
 */

/**
 * Report status enum
 */
export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
}

/**
 * Report priority levels
 */
export enum ReportPriority {
  ENLACE = 'Enlace',
  EJTV = 'EJTV',
  ENLACE_USA = 'Enlace USA',
  TODOS = 'Todos',
}

/**
 * Report categories
 */
export enum ReportCategory {
  TRANSMISSION = 'Transmisión',
  AUDIO = 'Audio',
  VIDEO = 'Video',
  EQUIPMENT = 'Equipos',
  SOFTWARE = 'Software',
  POWER_FAILURE = 'Falla Energética',
  OTHER = 'Otros',
}

/**
 * Email status for report notifications
 */
export enum EmailStatus {
  NONE = 'none',
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * Report interface
 */
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

/**
 * Attachment interface
 */
export interface Attachment {
  id: string;
  reportId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  data?: string;
  createdAt: Date;
}

/**
 * Comment interface
 */
export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reaction interface
 */
export interface Reaction {
  id: string;
  reportId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

/**
 * Create report request payload
 */
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

/**
 * Attachment input for report creation
 */
export interface AttachmentInput {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  data?: string;
}

/**
 * Update report request payload
 */
export interface UpdateReportRequest {
  id: string;
  status?: ReportStatus;
  dateResolved?: Date | null;
}

/**
 * Report list options
 */
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

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  criticalReports: number;
  reportsToday: number;
  averageResolutionTime: number;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Chart data
 */
export interface ChartData {
  labels: string[];
  values: number[];
}
