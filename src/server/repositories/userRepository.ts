import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import {
  ReportModel,
  SpecialEventModel,
  SpecialEventShiftModel,
  UserModel,
} from "@/models";
import type { Shift } from "@/lib/types";

export type UserRole = "ADMIN" | "BOSS" | "ENGINEER" | "OPERATOR";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRole;
  image: string | null;
  phone: string | null;
  birthday: string | null;
  schedule: string | null;
  tempSchedule: string | null;
  lastLogin: string | null;
  lastLoginIP: string | null;
  lastLoginCountry: string | null;
  currentPath: string | null;
  lastActive: string | null;
  createdAt: string;
};

export type SpecialEventRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type SpecialEventShiftRow = {
  id: string;
  eventId: string;
  userId: string;
  date: string;
  start: number;
  end: number;
};

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  image?: string;
  birthday?: string;
  schedule?: Shift[];
};

export type UpdateUserData = {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  image?: string;
  birthday?: string;
  schedule?: Shift[] | null;
  tempSchedule?: string;
};

function userToRow(u: Record<string, unknown>): UserRow {
  return {
    id: String(u._id),
    name: String(u.name),
    email: String(u.email),
    username: (u.username as string) ?? null,
    role: u.role as UserRole,
    image: (u.image as string) ?? null,
    phone: (u.phone as string) ?? null,
    birthday: (u.birthday as string) ?? null,
    schedule: (u.schedule as string) ?? null,
    tempSchedule: (u.tempSchedule as string) ?? null,
    lastLogin: u.lastLogin ? String(u.lastLogin) : null,
    lastLoginIP: (u.lastLoginIP as string) ?? null,
    lastLoginCountry: (u.lastLoginCountry as string) ?? null,
    currentPath: (u.currentPath as string) ?? null,
    lastActive: u.lastActive ? String(u.lastActive) : null,
    createdAt: String(u.createdAt),
  };
}

export async function listUsers() {
  await connectMongo();
  const users = await UserModel.find()
    .select(
      "name email username role image phone birthday schedule tempSchedule lastLogin lastLoginIP lastLoginCountry currentPath lastActive createdAt"
    )
    .sort({ role: 1, name: 1 })
    .lean();
  return users.map((u) => userToRow(u as Record<string, unknown>));
}

export async function countReportsByUser(userIds: string[]) {
  if (userIds.length === 0) return {};
  await connectMongo();
  const counts = await ReportModel.aggregate<{ _id: string; count: number }>([
    { $match: { operatorId: { $in: userIds } } },
    { $group: { _id: "$operatorId", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(counts.map((row) => [row._id, row.count]));
}

export async function findActiveSpecialEvent(weekStart: string, weekEnd: string) {
  await connectMongo();
  const event = await SpecialEventModel.findOne({
    isActive: true,
    startDate: { $lte: weekEnd },
    endDate: { $gte: weekStart },
  }).lean();
  if (!event) return null;
  return {
    id: String(event._id),
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    isActive: event.isActive,
  } as SpecialEventRow;
}

export async function listSpecialEventShifts(eventId: string) {
  await connectMongo();
  const rows = await SpecialEventShiftModel.find({ eventId }).lean();
  return rows.map(
    (r) =>
      ({
        id: String(r._id),
        eventId: r.eventId,
        userId: r.userId,
        date: r.date,
        start: r.start,
        end: r.end,
      }) as SpecialEventShiftRow
  );
}

export async function createUser(data: CreateUserData) {
  await connectMongo();
  const id = randomUUID();
  const doc = await UserModel.create({
    _id: id,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    image:
      data.image ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
    birthday: data.birthday || null,
    schedule: data.schedule ? JSON.stringify(data.schedule) : null,
  });
  return userToRow(doc.toObject() as Record<string, unknown>);
}

export async function getUserTempSchedule(id: string) {
  await connectMongo();
  const user = await UserModel.findById(id).select("tempSchedule").lean();
  return user?.tempSchedule ?? null;
}

export async function updateUser(data: UpdateUserData) {
  await connectMongo();
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.email !== undefined) patch.email = data.email;
  if (data.password !== undefined) patch.password = data.password;
  if (data.role !== undefined) patch.role = data.role;
  if (data.image !== undefined) patch.image = data.image;
  if (data.birthday !== undefined) patch.birthday = data.birthday;
  if (data.schedule !== undefined) {
    patch.schedule = data.schedule ? JSON.stringify(data.schedule) : null;
  }
  if (data.tempSchedule !== undefined) patch.tempSchedule = data.tempSchedule;

  const doc = await UserModel.findByIdAndUpdate(data.id, patch, { new: true }).lean();
  if (!doc) return undefined;
  return userToRow(doc as Record<string, unknown>);
}

export async function deleteUser(id: string) {
  await connectMongo();
  await UserModel.findByIdAndDelete(id);
}
