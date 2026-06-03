import {
  listScheduleOverrides,
  resetScheduleOverride,
  upsertScheduleOverride,
  listWeeklyScheduleConfig,
  saveWeeklyScheduleConfig,
  type WeeklyScheduleItem,
} from "@/server/repositories/scheduleRepository";

export async function getScheduleOverrides(start: string, end: string) {
  return listScheduleOverrides(start, end);
}

export async function setScheduleOverride(date: string, userId: string) {
  if (userId === "reset") {
    await resetScheduleOverride(date);
    return { success: true as const };
  }
  return upsertScheduleOverride(date, userId);
}

export async function getWeeklyScheduleConfig() {
  return listWeeklyScheduleConfig();
}

export async function updateWeeklyScheduleConfig(schedule: WeeklyScheduleItem[]) {
  await saveWeeklyScheduleConfig(schedule);
  return { success: true as const };
}
