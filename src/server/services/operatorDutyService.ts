import { NotFoundError, ValidationError } from "@/lib/errors";
import type { DiariosBoardDto, OperatorDuty } from "@/types/operatorDuty";
import {
  assignDuty,
  countAssignmentsForUser,
  createDuty,
  deleteDuty,
  findDutyById,
  listAllAssignments,
  listAllDuties,
  listDiariosProfiles,
  setDutyAssignments,
  transferAllDuties,
  unassignAllForUser,
  unassignDutyAll,
  unassignDutyFromUser,
  updateDuty,
} from "@/server/repositories/operatorDutyRepository";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapDuty(row: {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}): OperatorDuty {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sortOrder: row.sortOrder,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function resolveOperatorIds(
  operators: { id: string }[],
  opts: { assignToAll?: boolean; operatorIds?: string[] }
): string[] {
  const valid = new Set(operators.map((o) => o.id));
  if (opts.assignToAll) return operators.map((o) => o.id);
  if (!opts.operatorIds?.length) return [];
  const ids = opts.operatorIds.filter((id) => valid.has(id));
  if (ids.length !== opts.operatorIds.length) {
    throw new ValidationError("Uno o más operadores no son válidos");
  }
  return ids;
}

export async function getDiariosBoard(): Promise<DiariosBoardDto> {
  const [operators, dutiesRaw, assignmentsRaw] = await Promise.all([
    listDiariosProfiles(),
    listAllDuties(),
    listAllAssignments(),
  ]);

  const duties = dutiesRaw.map(mapDuty);
  const dutyMap = new Map(duties.map((d) => [d.id, d]));
  const dutyIdsWithAssignment = new Set(assignmentsRaw.map((a) => a.dutyId));
  const unassigned = duties.filter((d) => !dutyIdsWithAssignment.has(d.id));

  const byOperator: Record<string, OperatorDuty[]> = {};
  for (const op of operators) {
    byOperator[op.id] = [];
  }

  for (const a of assignmentsRaw) {
    const duty = dutyMap.get(a.dutyId);
    if (duty && byOperator[a.userId]) {
      byOperator[a.userId].push(duty);
    }
  }

  for (const opId of Object.keys(byOperator)) {
    const orderMap = new Map(
      assignmentsRaw
        .filter((a) => a.userId === opId)
        .map((a) => [a.dutyId, a.sortOrder])
    );
    byOperator[opId].sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    );
  }

  return {
    operators: operators.map((o) => ({
      id: o.id,
      name: o.name,
      image: o.image,
      role: o.role,
    })),
    duties,
    assignments: assignmentsRaw.map((a) => ({
      id: a.id,
      dutyId: a.dutyId,
      userId: a.userId,
      sortOrder: a.sortOrder,
      assignedAt: toIso(a.assignedAt),
    })),
    unassigned,
    byOperator,
  };
}

export async function createOperatorDuty(data: {
  title: string;
  description?: string | null;
  assignToAll?: boolean;
  operatorIds?: string[];
}) {
  const title = data.title.trim();
  if (!title) throw new ValidationError("El título de la función es requerido");
  const row = await createDuty({ title, description: data.description?.trim() || null });
  if (!row) throw new ValidationError("No se pudo crear la función");

  const operators = await listDiariosProfiles();
  const userIds = resolveOperatorIds(operators, data);
  if (userIds.length > 0) {
    await setDutyAssignments(row.id, userIds);
  }

  return mapDuty(row);
}

export async function updateOperatorDuty(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    assignToAll?: boolean;
    operatorIds?: string[];
  }
) {
  const existing = await findDutyById(id);
  if (!existing) throw new NotFoundError("Función");

  const patch: { title?: string; description?: string | null } = {};
  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) throw new ValidationError("El título no puede estar vacío");
    patch.title = title;
  }
  if (data.description !== undefined) {
    patch.description = data.description?.trim() || null;
  }

  const row = await updateDuty(id, patch);
  if (!row) throw new NotFoundError("Función");

  if (data.assignToAll !== undefined || data.operatorIds !== undefined) {
    const operators = await listDiariosProfiles();
    const userIds = resolveOperatorIds(operators, {
      assignToAll: data.assignToAll,
      operatorIds: data.operatorIds ?? [],
    });
    await setDutyAssignments(id, userIds);
  }

  return mapDuty(row);
}

export async function deleteOperatorDuty(id: string) {
  const existing = await findDutyById(id);
  if (!existing) throw new NotFoundError("Función");
  await deleteDuty(id);
  return { success: true, id };
}

export async function assignOperatorDuty(
  dutyId: string,
  userId: string | null,
  fromUserId?: string | null
) {
  const duty = await findDutyById(dutyId);
  if (!duty) throw new NotFoundError("Función");

  const operators = await listDiariosProfiles();
  const validIds = new Set(operators.map((o) => o.id));

  if (!userId) {
    if (fromUserId) {
      if (!validIds.has(fromUserId)) throw new ValidationError("Operador no válido");
      await unassignDutyFromUser(dutyId, fromUserId);
    } else {
      await unassignDutyAll(dutyId);
    }
    return { dutyId, userId: null, fromUserId: fromUserId ?? null };
  }

  if (!validIds.has(userId)) {
    throw new ValidationError("Operador no válido");
  }

  if (fromUserId && fromUserId !== userId) {
    if (!validIds.has(fromUserId)) throw new ValidationError("Operador de origen no válido");
    await unassignDutyFromUser(dutyId, fromUserId);
  }

  const count = await countAssignmentsForUser(userId);
  await assignDuty(dutyId, userId, count);
  return { dutyId, userId, fromUserId: fromUserId ?? null };
}

export async function bulkUnassignOperatorDuties(userId: string) {
  const operators = await listDiariosProfiles();
  if (!operators.some((o) => o.id === userId)) {
    throw new ValidationError("Operador no válido");
  }
  const removed = await unassignAllForUser(userId);
  return { userId, count: removed.length };
}

export async function bulkTransferOperatorDuties(fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) {
    throw new ValidationError("Seleccione un operador distinto");
  }
  const operators = await listDiariosProfiles();
  const ids = new Set(operators.map((o) => o.id));
  if (!ids.has(fromUserId) || !ids.has(toUserId)) {
    throw new ValidationError("Operador no válido");
  }

  const moved = await transferAllDuties(fromUserId, toUserId);
  return { fromUserId, toUserId, count: moved.length };
}
