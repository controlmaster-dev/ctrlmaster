import { connectMongo } from "@/lib/mongo";
import { loadUserBriefMap } from "@/lib/batchUsers";
import { WeeklyScheduleModel, WorkScheduleModel } from "@/models";

export async function loadWeeklyScheduleNameMap(): Promise<Record<string, string>> {
  await connectMongo();
  const rows = await WeeklyScheduleModel.find().select("dayOfWeek userId").lean();
  const userMap = await loadUserBriefMap(rows.map((r) => r.userId));
  const map: Record<string, string> = {};
  for (const row of rows) {
    const name = userMap.get(row.userId)?.name;
    if (name) map[String(row.dayOfWeek)] = name;
  }
  return map;
}

export async function loadWorkScheduleOverrideMap(
  startDate: string,
  endDate: string
): Promise<Record<string, string>> {
  await connectMongo();
  const rows = await WorkScheduleModel.find({
    date: { $gte: startDate, $lte: endDate },
    isOverride: true,
  })
    .select("date userId")
    .lean();
  const userMap = await loadUserBriefMap(rows.map((r) => r.userId));
  const map: Record<string, string> = {};
  for (const row of rows) {
    const name = userMap.get(row.userId)?.name;
    if (name) map[row.date] = name;
  }
  return map;
}
