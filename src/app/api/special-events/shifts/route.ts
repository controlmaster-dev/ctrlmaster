import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  getSpecialEventShifts,
  saveSpecialEventShifts,
} from "@/server/services/specialEventService";

export const dynamic = "force-dynamic";

const EVENT_ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

const shiftsQuerySchema = z.object({
  eventId: z.string().min(1, "Event ID required"),
});

const shiftEntrySchema = z.object({
  date: z.string(),
  start: z.union([z.string(), z.number()]),
  end: z.union([z.string(), z.number()]),
});

const saveShiftsSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  shifts: z.array(shiftEntrySchema),
});

export const GET = apiHandler(
  { auth: true, querySchema: shiftsQuerySchema },
  async ({ query }) => getSpecialEventShifts(query.eventId)
);

export const POST = apiHandler(
  { auth: true, roles: EVENT_ADMIN_ROLES, bodySchema: saveShiftsSchema },
  async ({ body }) => saveSpecialEventShifts(body.eventId, body.userId, body.shifts)
);
