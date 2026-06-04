import sql from "@/lib/db";
import {
  DIARIOS_EXCLUDED_EMAILS,
  DIARIOS_PROFILE_ROLES,
} from "@/lib/diariosProfiles";
import type { DiariosPriority } from "@/lib/diariosPriority";
import { ensureOperatorDutyTables } from "@/lib/ensureOperatorDutyTables";
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

export async function listDiariosProfiles() {
  await ensureOperatorDutyTables();
  return sql<DiariosOperatorRow[]>`
    SELECT "id", "name", "email", "username", "image", "role"
    FROM "User"
    WHERE "role" IN ${sql(DIARIOS_PROFILE_ROLES)}
      AND LOWER(COALESCE("email", '')) NOT IN ${sql(
        DIARIOS_EXCLUDED_EMAILS.map((e) => e.toLowerCase())
      )}
      AND LOWER(COALESCE("username", '')) NOT IN ('rjimenez', 'ingenieria')
    ORDER BY
      CASE "role"
        WHEN 'ADMIN' THEN 0
        WHEN 'BOSS' THEN 1
        ELSE 2
      END,
      "name" ASC
  `;
}

/** @deprecated Use listDiariosProfiles */
export const listOperatorProfiles = listDiariosProfiles;

export async function listAllDuties() {
  await ensureOperatorDutyTables();
  return sql<OperatorDutyRow[]>`
    SELECT
      "id", "title", "description", "sortOrder", "priority", "isGeneral",
      "createdAt", "updatedAt"
    FROM "OperatorDuty"
    ORDER BY "sortOrder" ASC, "title" ASC
  `;
}

export async function listAllAssignments() {
  await ensureOperatorDutyTables();
  return sql<OperatorDutyAssignmentRow[]>`
    SELECT "id", "dutyId", "userId", "sortOrder", "assignedAt"
    FROM "OperatorDutyAssignment"
    ORDER BY "sortOrder" ASC, "assignedAt" ASC
  `;
}

export async function createDuty(data: {
  title: string;
  description?: string | null;
  sortOrder?: number;
  priority?: DiariosPriority;
  isGeneral?: boolean;
}) {
  await ensureOperatorDutyTables();
  const [row] = await sql<OperatorDutyRow[]>`
    INSERT INTO "OperatorDuty" ("title", "description", "sortOrder", "priority", "isGeneral")
    VALUES (
      ${data.title},
      ${data.description ?? null},
      ${data.sortOrder ?? 0},
      ${data.priority ?? "medium"},
      ${data.isGeneral ?? false}
    )
    RETURNING "id", "title", "description", "sortOrder", "priority", "isGeneral", "createdAt", "updatedAt"
  `;
  return row;
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
  await ensureOperatorDutyTables();
  const [row] = await sql<OperatorDutyRow[]>`
    UPDATE "OperatorDuty"
    SET
      "title" = COALESCE(${data.title ?? null}, "title"),
      "description" = CASE WHEN ${data.description !== undefined} THEN ${data.description ?? null} ELSE "description" END,
      "sortOrder" = COALESCE(${data.sortOrder ?? null}, "sortOrder"),
      "priority" = COALESCE(${data.priority ?? null}, "priority"),
      "isGeneral" = CASE WHEN ${data.isGeneral !== undefined} THEN ${data.isGeneral ?? false} ELSE "isGeneral" END,
      "updatedAt" = NOW()
    WHERE "id" = ${id}
    RETURNING "id", "title", "description", "sortOrder", "priority", "isGeneral", "createdAt", "updatedAt"
  `;
  return row ?? null;
}

export async function deleteDuty(id: string) {
  await ensureOperatorDutyTables();
  await sql`DELETE FROM "OperatorDuty" WHERE "id" = ${id}`;
}

export async function findDutyById(id: string) {
  await ensureOperatorDutyTables();
  const [row] = await sql<OperatorDutyRow[]>`
    SELECT "id", "title", "description", "sortOrder", "priority", "isGeneral", "createdAt", "updatedAt"
    FROM "OperatorDuty"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  return row ?? null;
}

export async function assignDuty(dutyId: string, userId: string, sortOrder = 0) {
  await ensureOperatorDutyTables();
  const [row] = await sql<OperatorDutyAssignmentRow[]>`
    INSERT INTO "OperatorDutyAssignment" ("dutyId", "userId", "sortOrder")
    VALUES (${dutyId}, ${userId}, ${sortOrder})
    ON CONFLICT ("dutyId", "userId") DO UPDATE
    SET "sortOrder" = EXCLUDED."sortOrder",
        "assignedAt" = NOW()
    RETURNING "id", "dutyId", "userId", "sortOrder", "assignedAt"
  `;
  return row;
}

export async function unassignDutyFromUser(dutyId: string, userId: string) {
  await ensureOperatorDutyTables();
  await sql`
    DELETE FROM "OperatorDutyAssignment"
    WHERE "dutyId" = ${dutyId} AND "userId" = ${userId}
  `;
}

export async function unassignDutyAll(dutyId: string) {
  await ensureOperatorDutyTables();
  await sql`DELETE FROM "OperatorDutyAssignment" WHERE "dutyId" = ${dutyId}`;
}

export async function listAssignmentUserIdsForDuty(dutyId: string) {
  await ensureOperatorDutyTables();
  const rows = await sql<{ userId: string }[]>`
    SELECT "userId" FROM "OperatorDutyAssignment" WHERE "dutyId" = ${dutyId}
  `;
  return rows.map((r) => r.userId);
}

export async function setDutyAssignments(dutyId: string, userIds: string[]) {
  await ensureOperatorDutyTables();
  await sql`DELETE FROM "OperatorDutyAssignment" WHERE "dutyId" = ${dutyId}`;
  for (let i = 0; i < userIds.length; i++) {
    await assignDuty(dutyId, userIds[i], i);
  }
}

export async function unassignAllForUser(userId: string) {
  await ensureOperatorDutyTables();
  const rows = await sql<OperatorDutyAssignmentRow[]>`
    DELETE FROM "OperatorDutyAssignment"
    WHERE "userId" = ${userId}
    RETURNING "id", "dutyId", "userId", "sortOrder", "assignedAt"
  `;
  return rows;
}

export async function transferAllDuties(fromUserId: string, toUserId: string) {
  await ensureOperatorDutyTables();
  const rows = await sql<OperatorDutyAssignmentRow[]>`
    UPDATE "OperatorDutyAssignment"
    SET "userId" = ${toUserId}, "assignedAt" = NOW()
    WHERE "userId" = ${fromUserId}
    RETURNING "id", "dutyId", "userId", "sortOrder", "assignedAt"
  `;
  return rows;
}

export async function reorderAssignmentsForUser(userId: string, dutyIds: string[]) {
  await ensureOperatorDutyTables();
  for (let i = 0; i < dutyIds.length; i++) {
    await sql`
      UPDATE "OperatorDutyAssignment"
      SET "sortOrder" = ${i}
      WHERE "userId" = ${userId} AND "dutyId" = ${dutyIds[i]}
    `;
  }
}

export async function reorderUnassignedDuties(dutyIds: string[]) {
  await ensureOperatorDutyTables();
  for (let i = 0; i < dutyIds.length; i++) {
    await sql`
      UPDATE "OperatorDuty"
      SET "sortOrder" = ${i}, "updatedAt" = NOW()
      WHERE "id" = ${dutyIds[i]}
    `;
  }
}

export async function countAssignmentsForUser(userId: string) {
  await ensureOperatorDutyTables();
  const [row] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM "OperatorDutyAssignment"
    WHERE "userId" = ${userId}
  `;
  return row?.count ?? 0;
}
