"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiariosBoardDto } from "@/types/operatorDuty";

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
      setBoard(board);
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
    setBoard(next);
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

        return {
          ...prev,
          assignments: nextAssignments,
          byOperator: nextByOperator,
          unassigned,
        };
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
      const moving = prev.byOperator[userId] ?? [];
      const nextByOperator = { ...prev.byOperator, [userId]: [] };
      const nextAssignments = prev.assignments.filter((a) => a.userId !== userId);
      const unassignedIds = new Set(prev.unassigned.map((d) => d.id));
      const extraUnassigned = moving.filter((d) => {
        const stillOnOthers = nextAssignments.some((a) => a.dutyId === d.id);
        return !stillOnOthers && !unassignedIds.has(d.id);
      });
      return {
        ...prev,
        byOperator: nextByOperator,
        assignments: nextAssignments,
        unassigned: [...prev.unassigned, ...extraUnassigned],
      };
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

  const optimisticAddDuty = useCallback((duty: DiariosBoardDto["duties"][0]) => {
    setBoard((prev) => ({
      ...prev,
      duties: [...prev.duties, duty],
      unassigned: [...prev.unassigned, duty],
    }));
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

  const createDuty = useCallback(
    async (payload: {
      title: string;
      description?: string;
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
  };
}
