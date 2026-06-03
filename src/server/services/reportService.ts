import { ApiError, NotFoundError, ValidationError } from '@/lib/errors';
import type { CreateReportInput, UpdateReportInput } from '@/lib/validation';
import type { ReportListResponseDto } from '@/types/dto';
import {
  createReport,
  deleteReport,
  findReportId,
  getReportDetailById,
  listReports,
  updateReport,
  type ReportFilters,
  type ReportListRow,
} from '@/server/repositories/reportRepository';

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return value != null ? String(value) : "";
}

function mapReportListItem(row: ReportListRow) {
  return {
    id: row.id,
    operatorName: row.operatorName,
    operatorEmail: row.operatorEmail,
    problemDescription: row.problemDescription,
    category: row.category,
    priority: row.priority,
    status: row.status,
    createdAt: toIso(row.createdAt),
    dateStarted: toIso(row.dateStarted),
    dateResolved: row.dateResolved != null ? toIso(row.dateResolved) : null,
    emailStatus: row.emailStatus,
    emailRecipients: row.emailRecipients,
    _count: {
      comments: row.commentCount,
      reactions: row.reactionCount,
    },
  };
}

export async function getReports(filters: ReportFilters): Promise<ReportListResponseDto> {
  const safeLimit = Math.min(filters.limit || 50, 500);
  const safePage = Math.max(filters.page || 1, 1);

  const { reports, total } = await listReports({
    ...filters,
    page: safePage,
    limit: safeLimit,
  });

  return {
    reports: reports.map(mapReportListItem),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}

export async function createReportWithAttachments(data: CreateReportInput) {
  return createReport(data);
}

export async function deleteReportById(id?: string | null) {
  if (!id) {
    throw new ValidationError('ID de reporte es requerido');
  }

  const exists = await findReportId(id);
  if (!exists) {
    throw new NotFoundError('Reporte');
  }

  await deleteReport(id);
  return { success: true, id };
}

export async function updateReportById(data: UpdateReportInput) {
  const updated = await updateReport(data);
  if (!updated) {
    throw new ApiError('No fields to update', 400);
  }
  return updated;
}

export async function getReportDetail(id: string) {
  const detail = await getReportDetailById(id);
  if (!detail) {
    throw new NotFoundError('Reporte');
  }
  return detail;
}
