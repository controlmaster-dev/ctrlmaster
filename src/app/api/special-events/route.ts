import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  getSpecialEvents,
  addSpecialEvent,
  removeSpecialEvent,
  patchSpecialEvent,
} from "@/server/services/specialEventService";

export const dynamic = "force-dynamic";

const EVENT_ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

const createEventSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const patchEventSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const deleteEventQuerySchema = z.object({
  id: z.string().min(1),
});

export const GET = apiHandler({}, async () => {
  const mapped = await getSpecialEvents();
  return NextResponse.json(mapped, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
});

export const POST = apiHandler(
  { auth: true, roles: EVENT_ADMIN_ROLES, bodySchema: createEventSchema },
  async ({ body }) => addSpecialEvent(body.name, body.startDate, body.endDate)
);

export const DELETE = apiHandler(
  { auth: true, roles: EVENT_ADMIN_ROLES, querySchema: deleteEventQuerySchema },
  async ({ query }) => removeSpecialEvent(query.id)
);

export const PATCH = apiHandler(
  { auth: true, roles: EVENT_ADMIN_ROLES, bodySchema: patchEventSchema },
  async ({ body }) => patchSpecialEvent(body)
);
