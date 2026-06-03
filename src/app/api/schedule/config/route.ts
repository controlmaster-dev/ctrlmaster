import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  getWeeklyScheduleConfig,
  updateWeeklyScheduleConfig,
} from "@/server/services/scheduleService";

const scheduleItemSchema = z.object({
  dayOfWeek: z.number(),
  userId: z.string(),
});

const saveScheduleSchema = z.object({
  schedule: z.array(scheduleItemSchema),
});

const SCHEDULE_ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

export const GET = apiHandler({ auth: true }, async () => {
  const schedule = await getWeeklyScheduleConfig();
  return NextResponse.json(schedule, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
});

export const POST = apiHandler(
  { auth: true, roles: SCHEDULE_ADMIN_ROLES, bodySchema: saveScheduleSchema },
  async ({ body }) => updateWeeklyScheduleConfig(body.schedule)
);
