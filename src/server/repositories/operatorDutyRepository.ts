import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import {
  DIARIOS_EXCLUDED_EMAILS,
  DIARIOS_PROFILE_ROLES,
} from "@/lib/diariosProfiles";
import type { DiariosPriority } from "@/lib/diariosPriority";
import { OperatorDutyAssignmentModel, OperatorDutyModel, UserModel } from "@/models";
import type { OperatorDuty, OperatorDutyAssignment } from "@/types/operatorDuty";

export type OperatorDutyRow = OperatorDuty;
export type OperatorDutyAssignmentRow = OperatorDutyAssignment;

export type DiariosOperatorRow = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
};

function dutyRow(d: Record<string, unknown>): OperatorDutyRow {
  return {
    id: String(d._id),
    title: String(d.title),
    description: (d.description as string) ?? null,
    sortOrder: Number(d.sortOrder ?? 0),
    priority: (d.priority as DiariosPriority) ?? "medium",
    isGeneral: Boolean(d.isGeneral),
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
  };
}

function assignmentRow(d: Record<string, unknown>): OperatorDutyAssignmentRow {
  return {
    id: String(d._id),
    dutyId: String(d.dutyId),
    userId: String(d.userId),
    sortOrder: Number(d.sortOrder ?? 0),
    assignedAt:
      d.assignedAt instanceof Date ? d.assignedAt.toISOString() : String(d.assignedAt),
  };
}

export async function listDiariosProfiles() {
  await connectMongo();
  const excluded = DIARIOS_EXCLUDED_EMAILS.map((e) => e.toLowerCase());
  const rows = await UserModel.find({
    role: { $in: [...DIARIOS_PROFILE_ROLES] },
    username: { $nin: ["rjimenez", "ingenieria"] },
  })
    .select("name email username image role")
    .lean();

  const roleOrder: Record<string, number> = { ADMIN: 0, BOSS: 1, OPERATOR: 2 };
  return rows
    .filter((u) => !excluded.includes((u.email ?? "").toLowerCase()))
    .map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      username: u.username,
      image: u.image,
      role: u.role,
    }))
    .sort((a, b) => {
      const ra = roleOrder[a.role] ?? 9;
      const rb = roleOrder[b.role] ?? 9;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    }) as DiariosOperatorRow[];
}

export const listOperatorProfiles = listDiariosProfiles;

export async function listAllDuties() {
  await connectMongo();
  const rows = await OperatorDutyModel.find().sort({ sortOrder: 1, title: 1 }).lean();
  return rows.map((r) => dutyRow(r as Record<string, unknown>));
}

export async function listAllAssignments() {
  await connectMongo();
  const rows = await OperatorDutyAssignmentModel.find()
    .sort({ sortOrder: 1, assignedAt: 1 })
    .lean();
  return rows.map((r) => assignmentRow(r as Record<string, unknown>));
}

export async function createDuty(data: {
  title: string;
  description?: string | null;
  sortOrder?: number;
  priority?: DiariosPriority;
  isGeneral?: boolean;
}) {
  await connectMongo();
  const doc = await OperatorDutyModel.create({
    _id: randomUUID(),
    title: data.title,
    description: data.description ?? null,
    sortOrder: data.sortOrder ?? 0,
    priority: data.priority ?? "medium",
    isGeneral: data.isGeneral ?? false,
  });
  return dutyRow(doc.toObject() as Record<string, unknown>);
}

export async function updateDuty(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    sortOrder?: number;
    priority?: DiariosPriority;
    isGeneral?: boolean;
  }
) {
  await connectMongo();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (data.isGeneral !== undefined) patch.isGeneral = data.isGeneral;

  const doc = await OperatorDutyModel.findByIdAndUpdate(id, patch, { new: true }).lean();
  return doc ? dutyRow(doc as Record<string, unknown>) : null;
}

export async function deleteDuty(id: string) {
  await connectMongo();
  await OperatorDutyAssignmentModel.deleteMany({ dutyId: id });
  await OperatorDutyModel.findByIdAndDelete(id);
}

export async function findDutyById(id: string) {
  await connectMongo();
  const doc = await OperatorDutyModel.findById(id).lean();
  return doc ? dutyRow(doc as Record<string, unknown>) : null;
}

export async function assignDuty(dutyId: string, userId: string, sortOrder = 0) {
  await connectMongo();
  const doc = await OperatorDutyAssignmentModel.findOneAndUpdate(
    { dutyId, userId },
    {
      $set: { sortOrder, assignedAt: new Date() },
      $setOnInsert: { _id: randomUUID() },
    },
    { upsert: true, new: true }
  ).lean();
  return assignmentRow(doc as Record<string, unknown>);
}

export async function unassignDutyFromUser(dutyId: string, userId: string) {
  await connectMongo();
  await OperatorDutyAssignmentModel.deleteOne({ dutyId, userId });
}

export async function unassignDutyAll(dutyId: string) {
  await connectMongo();
  await OperatorDutyAssignmentModel.deleteMany({ dutyId });
}

export async function listAssignmentUserIdsForDuty(dutyId: string) {
  await connectMongo();
  const rows = await OperatorDutyAssignmentModel.find({ dutyId }).select("userId").lean();
  return rows.map((r) => r.userId);
}

export async function setDutyAssignments(dutyId: string, userIds: string[]) {
  await connectMongo();
  await OperatorDutyAssignmentModel.deleteMany({ dutyId });
  for (let i = 0; i < userIds.length; i++) {
    await assignDuty(dutyId, userIds[i], i);
  }
}

export async function unassignAllForUser(userId: string) {
  await connectMongo();
  const rows = await OperatorDutyAssignmentModel.find({ userId }).lean();
  await OperatorDutyAssignmentModel.deleteMany({ userId });
  return rows.map((r) => assignmentRow(r as Record<string, unknown>));
}

export async function transferAllDuties(fromUserId: string, toUserId: string) {
  await connectMongo();
  await OperatorDutyAssignmentModel.updateMany(
    { userId: fromUserId },
    { $set: { userId: toUserId, assignedAt: new Date() } }
  );
  const rows = await OperatorDutyAssignmentModel.find({ userId: toUserId }).lean();
  return rows.map((r) => assignmentRow(r as Record<string, unknown>));
}

export async function reorderAssignmentsForUser(userId: string, dutyIds: string[]) {
  await connectMongo();
  for (let i = 0; i < dutyIds.length; i++) {
    await OperatorDutyAssignmentModel.updateOne(
      { userId, dutyId: dutyIds[i] },
      { $set: { sortOrder: i } }
    );
  }
}

export async function reorderUnassignedDuties(dutyIds: string[]) {
  await connectMongo();
  for (let i = 0; i < dutyIds.length; i++) {
    await OperatorDutyModel.findByIdAndUpdate(dutyIds[i], {
      sortOrder: i,
      updatedAt: new Date(),
    });
  }
}

export async function countAssignmentsForUser(userId: string) {
  await connectMongo();
  return OperatorDutyAssignmentModel.countDocuments({ userId });
}
