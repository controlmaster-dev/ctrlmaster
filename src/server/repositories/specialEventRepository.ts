import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import { withMongoTransaction } from "@/lib/mongoHelpers";
import { loadUserBriefMap, userBriefFromMap } from "@/lib/batchUsers";
import { SpecialEventModel, SpecialEventShiftModel } from "@/models";

export type SpecialEventRow = {
  shiftCount: number;
  [key: string]: unknown;
};

export async function listSpecialEvents() {
  await connectMongo();
  const events = await SpecialEventModel.find().sort({ startDate: -1 }).lean();
  const counts = await SpecialEventShiftModel.aggregate<{ _id: string; shiftCount: number }>([
    { $group: { _id: "$eventId", shiftCount: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.shiftCount]));

  return events.map((e) => ({
    ...e,
    id: String(e._id),
    shiftCount: countMap.get(String(e._id)) ?? 0,
  })) as SpecialEventRow[];
}

export function mapSpecialEvents(events: SpecialEventRow[]) {
  return events.map((e) => ({
    ...e,
    _count: { shifts: e.shiftCount },
  }));
}

export async function createSpecialEvent(name: string, startDate: string, endDate: string) {
  await connectMongo();
  const doc = await SpecialEventModel.create({
    _id: randomUUID(),
    name,
    startDate,
    endDate,
    isActive: true,
  });
  const o = doc.toObject();
  return { ...o, id: String(doc._id) };
}

export async function deleteSpecialEvent(id: string) {
  await connectMongo();
  await SpecialEventShiftModel.deleteMany({ eventId: id });
  await SpecialEventModel.findByIdAndDelete(id);
}

export async function updateSpecialEvent(data: {
  id: string;
  isActive?: boolean;
  name?: string;
  startDate?: string;
  endDate?: string;
}) {
  await connectMongo();
  const patch: Record<string, unknown> = {};
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.name !== undefined) patch.name = data.name;
  if (data.startDate !== undefined) patch.startDate = data.startDate;
  if (data.endDate !== undefined) patch.endDate = data.endDate;

  const doc = await SpecialEventModel.findByIdAndUpdate(data.id, patch, { new: true }).lean();
  if (!doc) return null;
  return { ...doc, id: String(doc._id) };
}

export async function listSpecialEventShifts(eventId: string) {
  await connectMongo();
  const rows = await SpecialEventShiftModel.find({ eventId }).lean();
  const userMap = await loadUserBriefMap(rows.map((r) => r.userId));
  return rows.map((ses) => {
    const u = userBriefFromMap(userMap, ses.userId);
    return {
      ...ses,
      id: String(ses._id),
      user: { name: u.name, image: u.image },
    };
  });
}

export type SpecialEventShiftInput = {
  date: string;
  start: string | number;
  end: string | number;
};

export async function replaceSpecialEventShifts(
  eventId: string,
  userId: string,
  shifts: SpecialEventShiftInput[]
) {
  await withMongoTransaction(async (session) => {
    await SpecialEventShiftModel.deleteMany({ eventId, userId }, { session });
    if (shifts.length > 0) {
      await SpecialEventShiftModel.insertMany(
        shifts.map((s) => ({
          _id: randomUUID(),
          eventId,
          userId,
          date: s.date,
          start: Number(s.start),
          end: Number(s.end),
        })),
        { session }
      );
    }
  });
}
