import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { getScheduleOverrides, setScheduleOverride } from "@/server/services/scheduleService";

const getScheduleQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

const upsertScheduleSchema = z.object({
  date: z.string().min(1, "Fecha es requerida"),
  userId: z.string().min(1, "ID de usuario es requerido"),
});

export const GET = apiHandler(
  { auth: true, querySchema: getScheduleQuerySchema },
  async ({ query }) => {
    if (!query.start || !query.end) return [];
    return getScheduleOverrides(query.start, query.end);
  }
);

export const POST = apiHandler(
  { auth: true, bodySchema: upsertScheduleSchema },
  async ({ body }) => setScheduleOverride(body.date, body.userId)
);
