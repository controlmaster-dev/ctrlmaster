import sql from '@/lib/db';
import type { Shift } from '@/lib/types';

export type UserRole = 'ADMIN' | 'BOSS' | 'ENGINEER' | 'OPERATOR';

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
  role?: UserRole;
  image?: string;
  birthday?: string;
  schedule?: Shift[] | null;
  tempSchedule?: string;
};

export async function listUsers() {
  return sql<UserRow[]>`
    SELECT "id", "name", "email", "username", "role", "image", "phone",
           "birthday", "schedule", "tempSchedule",
           "lastLogin", "lastLoginIP", "lastLoginCountry",
           "currentPath", "lastActive", "createdAt"
    FROM "User"
    ORDER BY "role" ASC, "name" ASC
  `;
}

export async function countReportsByUser(userIds: string[]) {
  if (userIds.length === 0) return {};

  const counts = await sql<Array<{ operatorId: string; count: number }>>`
    SELECT "operatorId", COUNT(*)::int AS count
    FROM "Report"
    WHERE "operatorId" = ANY(${userIds})
    GROUP BY "operatorId"
  `;

  return Object.fromEntries(counts.map((row) => [row.operatorId, row.count]));
}

export async function findActiveSpecialEvent(weekStart: string, weekEnd: string) {
  const [event] = await sql<SpecialEventRow[]>`
    SELECT * FROM "SpecialEvent"
    WHERE "isActive" = TRUE
      AND "startDate" <= ${weekEnd}
      AND "endDate" >= ${weekStart}
    LIMIT 1
  `;

  return event ?? null;
}

export async function listSpecialEventShifts(eventId: string) {
  return sql<SpecialEventShiftRow[]>`
    SELECT * FROM "SpecialEventShift" WHERE "eventId" = ${eventId}
  `;
}

export async function createUser(data: CreateUserData) {
  const [newUser] = await sql<UserRow[]>`
    INSERT INTO "User" ("name", "email", "password", "role", "image", "birthday", "schedule")
    VALUES (
      ${data.name},
      ${data.email},
      ${data.password},
      ${data.role},
      ${data.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`},
      ${data.birthday || null},
      ${data.schedule ? JSON.stringify(data.schedule) : null}
    )
    RETURNING "id", "name", "email", "username", "role", "image", "phone",
              "birthday", "schedule", "tempSchedule",
              "lastLogin", "lastLoginIP", "lastLoginCountry",
              "currentPath", "lastActive", "createdAt"
  `;

  return newUser;
}

export async function getUserTempSchedule(id: string) {
  const [currentUser] = await sql<Array<{ tempSchedule: string | null }>>`
    SELECT "tempSchedule" FROM "User" WHERE "id" = ${id} LIMIT 1
  `;

  return currentUser?.tempSchedule ?? null;
}

export async function updateUser(data: UpdateUserData) {
  const [updatedUser] = await sql<UserRow[]>`
    UPDATE "User"
    SET
      "name" = COALESCE(${data.name || null}, "name"),
      "email" = COALESCE(${data.email || null}, "email"),
      "role" = COALESCE(${data.role || null}, "role"),
      "image" = COALESCE(${data.image ?? null}, "image"),
      "birthday" = COALESCE(${data.birthday ?? null}, "birthday"),
      "schedule" = ${data.schedule !== undefined ? (data.schedule ? JSON.stringify(data.schedule) : null) : sql`"schedule"`},
      "tempSchedule" = ${data.tempSchedule !== undefined ? data.tempSchedule : sql`"tempSchedule"`}
    WHERE "id" = ${data.id}
    RETURNING "id", "name", "email", "username", "role", "image", "phone",
              "birthday", "schedule", "tempSchedule",
              "lastLogin", "lastLoginIP", "lastLoginCountry",
              "currentPath", "lastActive", "createdAt"
  `;

  return updatedUser;
}

export async function deleteUser(id: string) {
  await sql`DELETE FROM "User" WHERE "id" = ${id}`;
}
