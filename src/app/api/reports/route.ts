import { z } from 'zod';
import { apiCreated, apiHandler } from '@/lib/api/handler';
import { createReportSchema, updateReportSchema } from '@/lib/validation';
import {
  createReportWithAttachments,
  deleteReportById,
  getReports,
  updateReportById,
} from '@/server/services/reportService';

const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  status: z.string().optional(),
  priority: z.string().optional(),
  operator: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const idQuerySchema = z.object({
  id: z.string().min(1, 'ID de reporte es requerido'),
});

export const GET = apiHandler(
  { auth: true, querySchema: reportListQuerySchema },
  async ({ query }) => getReports(query)
);

export const POST = apiHandler(
  { auth: true, bodySchema: createReportSchema },
  async ({ body }) => apiCreated(await createReportWithAttachments(body))
);

export const DELETE = apiHandler(
  { auth: true, roles: ['ENGINEER', 'ADMIN', 'BOSS'], querySchema: idQuerySchema },
  async ({ query }) => deleteReportById(query.id)
);

export const PATCH = apiHandler(
  { auth: true, bodySchema: updateReportSchema },
  async ({ body }) => updateReportById(body)
);
