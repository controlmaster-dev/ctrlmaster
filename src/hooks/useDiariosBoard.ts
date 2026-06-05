"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiariosPriority } from "@/lib/diariosPriority";
import { reorderDutiesInList } from "@/lib/diariosReorder";
import { sortDutyIdsByPriority } from "@/lib/diariosSort";
import type { DiariosBoardDto, OperatorDuty } from "@/types/operatorDuty";

function sortColumnDuties(duties: OperatorDuty[]): OperatorDuty[] {
  if (duties.length < 2) return duties;
  const orderMap = new Map(duties.map((d, i) => [d.id, i]));
  const ids = sortDutyIdsByPriority(duties, orderMap);
  const byId = new Map(duties.map((d) => [d.id, d]));
  return ids.map((id) => byId.get(id)!).filter(Boolean);
}

function withSortedColumns(board: DiariosBoardDto): DiariosBoardDto {
  const byOperator: Record<string, OperatorDuty[]> = {};
  for (const op of board.operators) {
    byOperator[op.id] = sortColumnDuties(board.byOperator[op.id] ?? []);
  }
  return {
    ...board,
    byOperator,
    unassigned: sortColumnDuties(board.unassigned),
  };
}

const emptyBoard = (): DiariosBoardDto => ({
  operators: [],
  duties: [],
  assignments: [],
  unassigned: [],
  byOperator: {},
});

export function useDiariosBoard(enabled = true) {
  const [board, setBoard] = useState<DiariosBoardDto>(emptyBoard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  const fetchBoard = useCallback(async (silent = false) => {
    if (!enabled) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/operator-duties", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : `Error ${res.status}`;
        throw new Error(msg);
      }
      const board = data as DiariosBoardDto;
      if (!mountedRef.current) return;
      setBoard(withSortedColumns(board));
    } catch (e) {
      console.error("[diarios] fetch error", e);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void fetchBoard(false);
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchBoard]);

  const applyBoard = useCallback((next: DiariosBoardDto) => {
    setBoard(withSortedColumns(next));
  }, []);

  const optimisticAssign = useCallback(
    (dutyId: string, userId: string | null, fromUserId?: string | null) => {
      setBoard((prev) => {
        const duty = prev.duties.find((d) => d.id === dutyId);
        if (!duty) return prev;

        const nextByOperator: Record<string, typeof prev.duties> = {};
        for (const op of prev.operators) {
          nextByOperator[op.id] = [...(prev.byOperator[op.id] ?? [])];
        }

        let nextAssignments = [...prev.assignments];
        let unassigned = prev.unassigned.filter((d) => d.id !== dutyId);

        const removeFromOperator = (opId: string) => {
          nextAssignments = nextAssignments.filter(
            (a) => !(a.dutyId === dutyId && a.userId === opId)
          );
          nextByOperator[opId] = nextByOperator[opId].filter((d) => d.id !== dutyId);
        };

        if (fromUserId) removeFromOperator(fromUserId);

        if (userId) {
          const exists = nextAssignments.some(
            (a) => a.dutyId === dutyId && a.userId === userId
          );
          if (!exists) {
            nextAssignments.push({
              id: `tmp-${dutyId}-${userId}`,
              dutyId,
              userId,
              sortOrder: nextByOperator[userId]?.length ?? 0,
              assignedAt: new Date().toISOString(),
            });
            nextByOperator[userId] = [...nextByOperator[userId], duty];
          }
        } else if (fromUserId) {
          const stillAssigned = nextAssignments.some((a) => a.dutyId === dutyId);
          if (!stillAssigned) unassigned = [...unassigned, duty];
        } else {
          nextAssignments = nextAssignments.filter((a) => a.dutyId !== dutyId);
          for (const op of prev.operators) {
            nextByOperator[op.id] = nextByOperator[op.id].filter((d) => d.id !== dutyId);
          }
          unassigned = [...unassigned, duty];
        }

        return withSortedColumns({
          ...prev,
          assignments: nextAssignments,
          byOperator: nextByOperator,
          unassigned,
        });
      });
    },
    []
  );

  const optimisticBulkTransfer = useCallback((fromUserId: string, toUserId: string) => {
    setBoard((prev) => {
      const moving = prev.byOperator[fromUserId] ?? [];
      if (moving.length === 0) return prev;

      const nextByOperator = { ...prev.byOperator };
      nextByOperator[fromUserId] = [];
      nextByOperator[toUserId] = [...(nextByOperator[toUserId] ?? []), ...moving];

      const nextAssignments = prev.assignments.map((a) =>
        a.userId === fromUserId ? { ...a, userId: toUserId } : a
      );

      return { ...prev, byOperator: nextByOperator, assignments: nextAssignments };
    });
  }, []);

  const optimisticBulkUnassign = useCallback((userId: string) => {
    setBoard((prev) => {
      const column = prev.byOperator[userId] ?? [];
      const keep = column.filter((d) => d.isGeneral);
      const moving = column.filter((d) => !d.isGeneral);

      const nextByOperator = { ...prev.byOperator, [userId]: keep };
      const nextAssignments = prev.assignments.filter(
        (a) => !(a.userId === userId && moving.some((d) => d.id === a.dutyId))
      );
      const unassignedIds = new Set(prev.unassigned.map((d) => d.id));
      const extraUnassigned = moving.filter((d) => {
        const stillOnOthers = nextAssignments.some((a) => a.dutyId === d.id);
        return !stillOnOthers && !unassignedIds.has(d.id);
      });
      return withSortedColumns({
        ...prev,
        byOperator: nextByOperator,
        assignments: nextAssignments,
        unassigned: [...prev.unassigned, ...extraUnassigned],
      });
    });
  }, []);

  const optimisticRemoveDuty = useCallback((dutyId: string) => {
    setBoard((prev) => {
      const duties = prev.duties.filter((d) => d.id !== dutyId);
      const assignments = prev.assignments.filter((a) => a.dutyId !== dutyId);
      const unassigned = prev.unassigned.filter((d) => d.id !== dutyId);
      const byOperator: Record<string, typeof prev.duties> = {};
      for (const op of prev.operators) {
        byOperator[op.id] = (prev.byOperator[op.id] ?? []).filter((d) => d.id !== dutyId);
      }
      return { ...prev, duties, assignments, unassigned, byOperator };
    });
  }, []);

  const optimisticReorderColumn = useCallback(
    (userId: string | null, dutyIds: string[]) => {
      setBoard((prev) => {
        const orderMap = new Map(dutyIds.map((id, i) => [id, i]));
        const sortList = (list: OperatorDuty[]) =>
          [...list].sort(
            (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
          );

        if (userId === null) {
          return {
            ...prev,
            unassigned: sortList(prev.unassigned),
            duties: sortList(prev.duties),
          };
        }

        const nextByOperator = { ...prev.byOperator };
        nextByOperator[userId] = sortList(prev.byOperator[userId] ?? []);

        const nextAssignments = prev.assignments.map((a) =>
          a.userId === userId
            ? { ...a, sortOrder: orderMap.get(a.dutyId) ?? a.sortOrder }
            : a
        );

        return { ...prev, byOperator: nextByOperator, assignments: nextAssignments };
      });
    },
    []
  );

  const optimisticPriority = useCallback((dutyId: string, priority: DiariosPriority) => {
    setBoard((prev) => {
      const patchDuty = (d: OperatorDuty) =>
        d.id === dutyId ? { ...d, priority } : d;
      const byOperator: Record<string, OperatorDuty[]> = {};
      for (const op of prev.operators) {
        byOperator[op.id] = (prev.byOperator[op.id] ?? []).map(patchDuty);
      }
      return withSortedColumns({
        ...prev,
        duties: prev.duties.map(patchDuty),
        unassigned: prev.unassigned.map(patchDuty),
        byOperator,
      });
    });
  }, []);

  const runMutation = useCallback(
    async (fn: () => Promise<Response>, rollback?: () => void) => {
      setSaving(true);
      try {
        const res = await fn();
        if (!res.ok) {
          rollback?.();
          await fetchBoard(true);
          return false;
        }
        await fetchBoard(true);
        return true;
      } catch {
        rollback?.();
        await fetchBoard(true);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchBoard]
  );

  const assignDuty = useCallback(
    async (dutyId: string, userId: string | null, fromUserId?: string | null) => {
      const snapshot = board;
      optimisticAssign(dutyId, userId, fromUserId);
      return runMutation(
        () =>
          fetch("/api/operator-duties/assign", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dutyId, userId, fromUserId: fromUserId ?? null }),
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticAssign, runMutation, applyBoard]
  );

  const reorderColumn = useCallback(
    async (userId: string | null, dutyIds: string[]) => {
      const snapshot = board;
      optimisticReorderColumn(userId, dutyIds);
      return runMutation(
        () =>
          fetch("/api/operator-duties/reorder", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, dutyIds }),
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticReorderColumn, runMutation, applyBoard]
  );

  const reorderDutyInColumn = useCallback(
    async (
      userId: string | null,
      duties: OperatorDuty[],
      draggedId: string,
      toIndex: number
    ) => {
      const next = reorderDutiesInList(duties, draggedId, toIndex);
      if (next.map((d) => d.id).join() === duties.map((d) => d.id).join()) return true;
      return reorderColumn(userId, next.map((d) => d.id));
    },
    [reorderColumn]
  );

  const updatePriority = useCallback(
    async (dutyId: string, priority: DiariosPriority) => {
      const snapshot = board;
      optimisticPriority(dutyId, priority);
      return runMutation(
        () =>
          fetch(`/api/operator-duties/${encodeURIComponent(dutyId)}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticPriority, runMutation, applyBoard]
  );

  const createDuty = useCallback(
    async (payload: {
      title: string;
      description?: string;
      priority?: DiariosPriority;
      isGeneral?: boolean;
      assignToAll?: boolean;
      operatorIds?: string[];
    }) => {
      return runMutation(() =>
        fetch("/api/operator-duties", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            description: payload.description || null,
            priority: payload.priority,
            isGeneral: payload.isGeneral ?? false,
            assignToAll: payload.assignToAll ?? false,
            operatorIds: payload.operatorIds ?? [],
          }),
        })
      );
    },
    [runMutation]
  );

  const updateDuty = useCallback(
    async (
      id: string,
      data: {
        title?: string;
        description?: string | null;
        priority?: DiariosPriority;
        isGeneral?: boolean;
        assignToAll?: boolean;
        operatorIds?: string[];
      }
    ) => {
      return runMutation(() =>
        fetch(`/api/operator-duties/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      );
    },
    [runMutation]
  );

  const deleteDuty = useCallback(
    async (id: string) => {
      const snapshot = board;
      optimisticRemoveDuty(id);
      return runMutation(
        () =>
          fetch(`/api/operator-duties?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticRemoveDuty, runMutation, applyBoard]
  );

  const bulkUnassign = useCallback(
    async (userId: string) => {
      const snapshot = board;
      optimisticBulkUnassign(userId);
      return runMutation(
        () =>
          fetch("/api/operator-duties/transfer", {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticBulkUnassign, runMutation, applyBoard]
  );

  const bulkTransfer = useCallback(
    async (fromUserId: string, toUserId: string) => {
      const snapshot = board;
      optimisticBulkTransfer(fromUserId, toUserId);
      return runMutation(
        () =>
          fetch("/api/operator-duties/transfer", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromUserId, toUserId }),
          }),
        () => applyBoard(snapshot)
      );
    },
    [board, optimisticBulkTransfer, runMutation, applyBoard]
  );

  return {
    board,
    loading,
    saving,
    refresh: () => fetchBoard(true),
    assignDuty,
    createDuty,
    updateDuty,
    deleteDuty,
    bulkUnassign,
    bulkTransfer,
    reorderColumn,
    reorderDutyInColumn,
    updatePriority,
  };
}
