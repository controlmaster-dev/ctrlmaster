import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import { loadUserBriefMap, userBriefFromMap } from "@/lib/batchUsers";
import { withMongoTransaction } from "@/lib/mongoHelpers";
import { WeeklyScheduleModel, WorkScheduleModel } from "@/models";

export async function listScheduleOverrides(start: string, end: string) {
  await connectMongo();
  const rows = await WorkScheduleModel.find({
    date: { $gte: start, $lte: end },
    isOverride: true,
  }).lean();

  const userMap = await loadUserBriefMap(rows.map((r) => r.userId));
  return rows.map((ws) => ({
    ...ws,
    id: String(ws._id),
    user: userBriefFromMap(userMap, ws.userId),
  }));
}

export async function resetScheduleOverride(date: string) {
  await connectMongo();
  await WorkScheduleModel.deleteMany({ date });
}

export async function upsertScheduleOverride(date: string, userId: string) {
  await connectMongo();
  const doc = await WorkScheduleModel.findOneAndUpdate(
    { date },
    { $set: { userId, isOverride: true }, $setOnInsert: { _id: randomUUID() } },
    { upsert: true, new: true }
  ).lean();
  return { ...doc, id: String(doc!._id) };
}

export async function listWeeklyScheduleConfig() {
  await connectMongo();
  const rows = await WeeklyScheduleModel.find().lean();
  const userMap = await loadUserBriefMap(rows.map((r) => r.userId));
  return rows.map((ws) => ({
    ...ws,
    id: String(ws._id),
    user: userBriefFromMap(userMap, ws.userId),
  }));
}

export type WeeklyScheduleItem = {
  dayOfWeek: number;
  userId: string;
};

export async function saveWeeklyScheduleConfig(schedule: WeeklyScheduleItem[]) {
  if (schedule.length === 0) return;

  await withMongoTransaction(async (session) => {
    for (const item of schedule) {
      if (item.userId === "REMOVE") {
        await WeeklyScheduleModel.deleteMany({ dayOfWeek: item.dayOfWeek }, { session });
      } else {
        await WeeklyScheduleModel.findOneAndUpdate(
          { dayOfWeek: item.dayOfWeek },
          {
            $set: { userId: item.userId },
            $setOnInsert: { _id: randomUUID() },
          },
          { upsert: true, session }
        );
      }
    }
  });
}
