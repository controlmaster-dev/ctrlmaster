import { NotFoundError, ValidationError } from "@/lib/errors";
import { normalizeDiariosPriority } from "@/lib/diariosPriority";
import { sortDutyIdsByPriority } from "@/lib/diariosSort";
import type { DiariosBoardDto, OperatorDuty } from "@/types/operatorDuty";
import {
  assignDuty,
  countAssignmentsForUser,
  createDuty,
  deleteDuty,
  findDutyById,
  listAllAssignments,
  listAllDuties,
  listAssignmentUserIdsForDuty,
  listDiariosProfiles,
  reorderAssignmentsForUser,
  reorderUnassignedDuties,
  setDutyAssignments,
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
  priority?: string | null;
  isGeneral?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): OperatorDuty {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sortOrder: row.sortOrder,
    priority: normalizeDiariosPriority(row.priority),
    isGeneral: Boolean(row.isGeneral),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function resolveOperatorIds(
  operators: { id: string }[],
  opts: { isGeneral?: boolean; assignToAll?: boolean; operatorIds?: string[] }
): string[] {
  const valid = new Set(operators.map((o) => o.id));
  if (opts.isGeneral || opts.assignToAll) return operators.map((o) => o.id);
  if (!opts.operatorIds?.length) return [];
  const ids = opts.operatorIds.filter((id) => valid.has(id));
  if (ids.length !== opts.operatorIds.length) {
    throw new ValidationError("Uno o más operadores no son válidos");
  }
  return ids;
}

function sortDutyList<T extends OperatorDuty>(
  duties: T[],
  orderMap: Map<string, number>
): T[] {
  const ids = sortDutyIdsByPriority(duties, orderMap);
  const byId = new Map(duties.map((d) => [d.id, d]));
  return ids.map((id) => byId.get(id)).filter((d): d is T => d != null);
}

async function resortUserColumn(userId: string) {
  const duties = (await listAllDuties()).map(mapDuty);
  const dutyMap = new Map(duties.map((d) => [d.id, d]));
  const assignments = await listAllAssignments();
  const userAssignments = assignments.filter((a) => a.userId === userId);
  if (userAssignments.length === 0) return;

  const orderMap = new Map(userAssignments.map((a) => [a.dutyId, a.sortOrder]));
  const list = userAssignments
    .map((a) => dutyMap.get(a.dutyId))
    .filter((d): d is OperatorDuty => d != null);

  const sortedIds = sortDutyIdsByPriority(list, orderMap);
  await reorderAssignmentsForUser(userId, sortedIds);
}

async function resortUnassignedColumn() {
  const duties = (await listAllDuties()).map(mapDuty);
  const assignments = await listAllAssignments();
  const assignedIds = new Set(assignments.map((a) => a.dutyId));
  const unassigned = duties.filter((d) => !assignedIds.has(d.id));
  if (unassigned.length === 0) return;

  const orderMap = new Map(unassigned.map((d) => [d.id, d.sortOrder]));
  const sortedIds = sortDutyIdsByPriority(unassigned, orderMap);
  await reorderUnassignedDuties(sortedIds);
}

async function resortColumnsForDuty(dutyId: string) {
  const assignments = await listAllAssignments();
  const userIds = [...new Set(assignments.filter((a) => a.dutyId === dutyId).map((a) => a.userId))];
  await Promise.all(userIds.map((uid) => resortUserColumn(uid)));
  const hasAssignment = assignments.some((a) => a.dutyId === dutyId);
  if (!hasAssignment) await resortUnassignedColumn();
}

async function syncGeneralDutyAssignments(
  operators: { id: string }[],
  duties: OperatorDuty[]
) {
  const operatorIds = operators.map((o) => o.id);
  if (operatorIds.length === 0) return;

  const generalDuties = duties.filter((d) => d.isGeneral);
  for (const duty of generalDuties) {
    const current = await listAssignmentUserIdsForDuty(duty.id);
    const currentSet = new Set(current);
    const needsSync =
      current.length !== operatorIds.length ||
      operatorIds.some((id) => !currentSet.has(id));
    if (needsSync) {
      await setDutyAssignments(duty.id, operatorIds);
    }
  }
}

export async function getDiariosBoard(): Promise<DiariosBoardDto> {
  const [operators, dutiesRaw] = await Promise.all([
    listDiariosProfiles(),
    listAllDuties(),
  ]);

  const duties = dutiesRaw.map(mapDuty);
  await syncGeneralDutyAssignments(operators, duties);

  const assignmentsAfterSync = await listAllAssignments();
  const dutyMap = new Map(duties.map((d) => [d.id, d]));
  const dutyIdsWithAssignment = new Set(assignmentsAfterSync.map((a) => a.dutyId));

  const unassignedOrder = new Map(
    duties.filter((d) => !dutyIdsWithAssignment.has(d.id)).map((d) => [d.id, d.sortOrder])
  );
  const unassigned = sortDutyList(
    duties.filter((d) => !dutyIdsWithAssignment.has(d.id)),
    unassignedOrder
  );

  const byOperator: Record<string, OperatorDuty[]> = {};
  for (const op of operators) {
    byOperator[op.id] = [];
  }

  for (const a of assignmentsAfterSync) {
    const duty = dutyMap.get(a.dutyId);
    if (duty && byOperator[a.userId]) {
      byOperator[a.userId].push(duty);
    }
  }

  for (const opId of Object.keys(byOperator)) {
    const orderMap = new Map(
      assignmentsAfterSync
        .filter((a) => a.userId === opId)
        .map((a) => [a.dutyId, a.sortOrder])
    );
    byOperator[opId] = sortDutyList(byOperator[opId], orderMap);
  }

  return {
    operators: operators.map((o) => ({
      id: o.id,
      name: o.name,
      image: o.image,
      role: o.role,
    })),
    duties,
    assignments: assignmentsAfterSync.map((a) => ({
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
  priority?: string;
  isGeneral?: boolean;
  assignToAll?: boolean;
  operatorIds?: string[];
}) {
  const title = data.title.trim();
  if (!title) throw new ValidationError("El título de la función es requerido");

  const isGeneral = data.isGeneral === true;
  const row = await createDuty({
    title,
    description: data.description?.trim() || null,
    priority: normalizeDiariosPriority(data.priority),
    isGeneral,
  });
  if (!row) throw new ValidationError("No se pudo crear la función");

  const operators = await listDiariosProfiles();
  const userIds = resolveOperatorIds(operators, { ...data, isGeneral });

  if (userIds.length > 0) {
    await setDutyAssignments(row.id, userIds);
    await Promise.all(userIds.map((uid) => resortUserColumn(uid)));
  } else if (!isGeneral) {
    await resortUnassignedColumn();
  }

  return mapDuty(row);
}

export async function updateOperatorDuty(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: string;
    isGeneral?: boolean;
    assignToAll?: boolean;
    operatorIds?: string[];
  }
) {
  const existing = await findDutyById(id);
  if (!existing) throw new NotFoundError("Función");

  const patch: {
    title?: string;
    description?: string | null;
    priority?: ReturnType<typeof normalizeDiariosPriority>;
    isGeneral?: boolean;
  } = {};

  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) throw new ValidationError("El título no puede estar vacío");
    patch.title = title;
  }
  if (data.description !== undefined) {
    patch.description = data.description?.trim() || null;
  }
  if (data.priority !== undefined) {
    patch.priority = normalizeDiariosPriority(data.priority);
  }
  if (data.isGeneral !== undefined) {
    patch.isGeneral = data.isGeneral;
  }

  const row = await updateDuty(id, patch);
  if (!row) throw new NotFoundError("Función");

  const operators = await listDiariosProfiles();
  const duty = mapDuty(row);

  const assignmentTouched =
    data.isGeneral !== undefined ||
    data.assignToAll !== undefined ||
    data.operatorIds !== undefined;

  if (assignmentTouched || duty.isGeneral) {
    const userIds = resolveOperatorIds(operators, {
      isGeneral: duty.isGeneral,
      assignToAll: data.assignToAll,
      operatorIds: data.operatorIds,
    });
    if (duty.isGeneral) {
      await setDutyAssignments(id, operators.map((o) => o.id));
      await Promise.all(operators.map((o) => resortUserColumn(o.id)));
    } else if (data.assignToAll !== undefined || data.operatorIds !== undefined) {
      await setDutyAssignments(id, userIds);
      for (const uid of userIds) {
        await resortUserColumn(uid);
      }
    }
  }

  if (data.priority !== undefined) {
    await resortColumnsForDuty(id);
  }

  return duty;
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
  const dutyRaw = await findDutyById(dutyId);
  if (!dutyRaw) throw new NotFoundError("Función");
  const duty = mapDuty(dutyRaw);

  const operators = await listDiariosProfiles();
  const validIds = new Set(operators.map((o) => o.id));

  if (!userId) {
    if (duty.isGeneral && fromUserId) {
      throw new ValidationError(
        "Las tareas generales no se quitan de una sola persona. Edite la función y desactive «Tarea general»."
      );
    }
    if (fromUserId) {
      if (!validIds.has(fromUserId)) throw new ValidationError("Operador no válido");
      await unassignDutyFromUser(dutyId, fromUserId);
      await resortUserColumn(fromUserId);
    } else {
      await unassignDutyAll(dutyId);
      await resortUnassignedColumn();
    }
    return { dutyId, userId: null, fromUserId: fromUserId ?? null };
  }

  if (!validIds.has(userId)) {
    throw new ValidationError("Operador no válido");
  }

  if (fromUserId && fromUserId !== userId) {
    if (!validIds.has(fromUserId)) throw new ValidationError("Operador de origen no válido");
    if (duty.isGeneral) {
      throw new ValidationError("Las tareas generales están en todo el equipo; no se pueden mover entre personas.");
    }
    await unassignDutyFromUser(dutyId, fromUserId);
    await resortUserColumn(fromUserId);
  }

  await assignDuty(dutyId, userId, await countAssignmentsForUser(userId));
  await resortUserColumn(userId);

  return { dutyId, userId, fromUserId: fromUserId ?? null };
}

export async function bulkUnassignOperatorDuties(userId: string) {
  const operators = await listDiariosProfiles();
  if (!operators.some((o) => o.id === userId)) {
    throw new ValidationError("Operador no válido");
  }

  const duties = (await listAllDuties()).map(mapDuty);
  const generalIds = new Set(duties.filter((d) => d.isGeneral).map((d) => d.id));
  const assignments = await listAllAssignments();
  const toRemove = assignments.filter(
    (a) => a.userId === userId && !generalIds.has(a.dutyId)
  );

  for (const a of toRemove) {
    await unassignDutyFromUser(a.dutyId, userId);
  }

  await resortUserColumn(userId);
  await syncGeneralDutyAssignments(operators, duties);

  return { userId, count: toRemove.length };
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

  const duties = (await listAllDuties()).map(mapDuty);
  const generalIds = new Set(duties.filter((d) => d.isGeneral).map((d) => d.id));
  const assignments = await listAllAssignments();
  const transferable = assignments.filter(
    (a) => a.userId === fromUserId && !generalIds.has(a.dutyId)
  );

  for (const a of transferable) {
    await unassignDutyFromUser(a.dutyId, fromUserId);
    await assignDuty(a.dutyId, toUserId, await countAssignmentsForUser(toUserId));
  }

  await resortUserColumn(fromUserId);
  await resortUserColumn(toUserId);
  await syncGeneralDutyAssignments(operators, duties);

  return { fromUserId, toUserId, count: transferable.length };
}

export async function reorderOperatorDuties(
  userId: string | null,
  dutyIds: string[]
) {
  const unique = [...new Set(dutyIds)];
  if (unique.length !== dutyIds.length) {
    throw new ValidationError("Lista de funciones duplicada");
  }

  const duties = (await listAllDuties()).map(mapDuty);

  if (userId === null) {
    const dutyIdSet = new Set(duties.map((d) => d.id));
    const assignedDutyIds = new Set(
      (await listAllAssignments()).map((a) => a.dutyId)
    );
    for (const id of unique) {
      if (!dutyIdSet.has(id)) throw new NotFoundError("Función");
      if (assignedDutyIds.has(id)) {
        throw new ValidationError("Solo se pueden ordenar funciones sin asignar");
      }
    }
    const orderMap = new Map(unique.map((id, i) => [id, i]));
    const list = unique
      .map((id) => duties.find((d) => d.id === id))
      .filter((d): d is OperatorDuty => d != null);
    const sortedIds = sortDutyIdsByPriority(list, orderMap);
    await reorderUnassignedDuties(sortedIds);
    return { userId: null, count: sortedIds.length };
  }

  const operators = await listDiariosProfiles();
  if (!operators.some((o) => o.id === userId)) {
    throw new ValidationError("Operador no válido");
  }

  const assignments = await listAllAssignments();
  const userDutyIds = new Set(
    assignments.filter((a) => a.userId === userId).map((a) => a.dutyId)
  );
  if (unique.length !== userDutyIds.size || !unique.every((id) => userDutyIds.has(id))) {
    throw new ValidationError("Las funciones no coinciden con la columna");
  }

  const orderMap = new Map(unique.map((id, i) => [id, i]));
  const list = unique
    .map((id) => duties.find((d) => d.id === id))
    .filter((d): d is OperatorDuty => d != null);
  const sortedIds = sortDutyIdsByPriority(list, orderMap);
  await reorderAssignmentsForUser(userId, sortedIds);
  return { userId, count: sortedIds.length };
}
