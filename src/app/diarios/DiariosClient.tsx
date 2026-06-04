"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  DiariosDutyFormDialog,
  type DiariosDutyFormPayload,
} from "@/components/diarios/DiariosDutyFormDialog";
import { DiariosMobileColumnPicker } from "@/components/diarios/DiariosMobileColumnPicker";
import { DiariosOperatorColumn } from "@/components/diarios/DiariosOperatorColumn";
import { DiariosTransferDialog } from "@/components/diarios/DiariosTransferDialog";
import { DiariosUnassignedPanel } from "@/components/diarios/DiariosUnassignedPanel";
import { useDiariosBoard } from "@/hooks/useDiariosBoard";
import type { DiariosPriority } from "@/lib/diariosPriority";
import { cn } from "@/lib/utils";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";

const MANAGE_ROLES = new Set(["ADMIN", "BOSS", "ENGINEER"]);

export function DiariosClient() {
  const { user } = useAuth();
  const canEdit = MANAGE_ROLES.has(user?.role ?? "");
  const currentUserId = user?.id ?? null;

  const {
    board,
    loading,
    saving,
    assignDuty,
    createDuty,
    updateDuty,
    deleteDuty,
    bulkUnassign,
    bulkTransfer,
    reorderDutyInColumn,
    updatePriority,
  } = useDiariosBoard(!!user);

  const [mobileOperatorId, setMobileOperatorId] = useState("");
  const mobilePickedRef = useRef(false);
  const [draggingDutyId, setDraggingDutyId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<{
    dutyId: string;
    userId: string | null;
  } | null>(null);
  const [dutyFormOpen, setDutyFormOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<OperatorDuty | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<DiariosOperator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OperatorDuty | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<DiariosOperator | null>(null);

  const totalAssigned = useMemo(
    () => board.assignments.length,
    [board.assignments.length]
  );

  const dutySharedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of board.assignments) {
      counts[a.dutyId] = (counts[a.dutyId] ?? 0) + 1;
    }
    return counts;
  }, [board.assignments]);

  const operatorDutyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const op of board.operators) {
      counts[op.id] = board.byOperator[op.id]?.length ?? 0;
    }
    return counts;
  }, [board.operators, board.byOperator]);

  const operatorIdsKey = useMemo(
    () => board.operators.map((o) => o.id).join("|"),
    [board.operators]
  );

  useEffect(() => {
    if (!board.operators.length) {
      setMobileOperatorId("");
      mobilePickedRef.current = false;
      return;
    }
    const stillValid =
      mobileOperatorId && board.operators.some((o) => o.id === mobileOperatorId);
    if (mobilePickedRef.current && stillValid) return;

    const defaultId =
      currentUserId && board.operators.some((o) => o.id === currentUserId)
        ? currentUserId
        : board.operators[0].id;
    setMobileOperatorId(defaultId);
  }, [operatorIdsKey, currentUserId, mobileOperatorId, board.operators]);

  const handleMobileSelect = (id: string) => {
    mobilePickedRef.current = true;
    setMobileOperatorId(id);
  };

  const endDrag = () => {
    setDraggingDutyId(null);
    setDragSource(null);
  };

  const handleAssign = async (
    dutyId: string,
    userId: string | null,
    fromUserId?: string | null
  ) => {
    const ok = await assignDuty(dutyId, userId, fromUserId);
    if (!ok) toast.error("No se pudo mover la función");
    endDrag();
  };

  const handleReorderAtIndex = async (
    columnUserId: string | null,
    draggedId: string,
    toIndex: number
  ) => {
    const list =
      columnUserId === null
        ? board.unassigned
        : (board.byOperator[columnUserId] ?? []);
    const ok = await reorderDutyInColumn(columnUserId, list, draggedId, toIndex);
    if (!ok) toast.error("No se pudo reordenar");
    endDrag();
  };

  const handleMoveUp = async (columnUserId: string | null, dutyId: string) => {
    const list =
      columnUserId === null
        ? board.unassigned
        : (board.byOperator[columnUserId] ?? []);
    const idx = list.findIndex((d) => d.id === dutyId);
    if (idx <= 0) return;
    await handleReorderAtIndex(columnUserId, dutyId, idx - 1);
  };

  const handleMoveDown = async (columnUserId: string | null, dutyId: string) => {
    const list =
      columnUserId === null
        ? board.unassigned
        : (board.byOperator[columnUserId] ?? []);
    const idx = list.findIndex((d) => d.id === dutyId);
    if (idx < 0 || idx >= list.length - 1) return;
    await handleReorderAtIndex(columnUserId, dutyId, idx + 1);
  };

  const handlePriorityChange = async (dutyId: string, priority: DiariosPriority) => {
    const ok = await updatePriority(dutyId, priority);
    if (!ok) toast.error("No se pudo cambiar la prioridad");
  };

  const handleMoveDutyTo = (
    dutyId: string,
    toUserId: string | null,
    fromUserId: string | null
  ) => {
    void handleAssign(dutyId, toUserId, fromUserId);
  };

  const dutyFormAssignment = useMemo(() => {
    if (!editingDuty) {
      return { operatorIds: [] as string[], assignToAll: false, isGeneral: false };
    }
    const operatorIds = board.assignments
      .filter((a) => a.dutyId === editingDuty.id)
      .map((a) => a.userId);
    const allIds = board.operators.map((o) => o.id);
    const assignToAll =
      allIds.length > 0 &&
      allIds.length === operatorIds.length &&
      allIds.every((id) => operatorIds.includes(id));
    return {
      operatorIds,
      assignToAll: editingDuty.isGeneral || assignToAll,
      isGeneral: editingDuty.isGeneral,
    };
  }, [editingDuty, board.assignments, board.operators]);

  const openCreateDuty = () => {
    setEditingDuty(null);
    setDutyFormOpen(true);
  };

  const openEditDuty = (duty: OperatorDuty) => {
    setEditingDuty(duty);
    setDutyFormOpen(true);
  };

  const handleDutySubmit = async (data: DiariosDutyFormPayload) => {
    if (editingDuty) {
      const ok = await updateDuty(editingDuty.id, {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        isGeneral: data.isGeneral,
        assignToAll: data.assignToAll,
        operatorIds: data.operatorIds,
      });
      if (ok) toast.success("Función actualizada");
      else toast.error("Error al guardar");
      return ok;
    }
    const ok = await createDuty({
      title: data.title,
      description: data.description,
      priority: data.priority,
      isGeneral: data.isGeneral,
      assignToAll: data.assignToAll,
      operatorIds: data.operatorIds,
    });
    if (ok) toast.success("Función creada");
    else toast.error("Error al crear");
    return ok;
  };

  const confirmDeleteDuty = async () => {
    if (!deleteTarget) return;
    const ok = await deleteDuty(deleteTarget.id);
    if (ok) toast.success("Función eliminada");
    else toast.error("Error al eliminar");
    setDeleteTarget(null);
  };

  const confirmUnassignAll = async () => {
    if (!unassignTarget) return;
    const ok = await bulkUnassign(unassignTarget.id);
    if (ok) toast.success(`Funciones desligadas de ${unassignTarget.name}`);
    else toast.error("Error al desligar");
    setUnassignTarget(null);
  };

  const handleTransfer = async (toUserId: string) => {
    if (!transferFrom) return false;
    const ok = await bulkTransfer(transferFrom.id, toUserId);
    if (ok) {
      const toName = board.operators.find((o) => o.id === toUserId)?.name ?? "operador";
      toast.success(`Funciones delegadas a ${toName}`);
    } else {
      toast.error("Error al delegar");
    }
    return ok;
  };

  if (loading) {
    return (
      <div className="diarios-ui flex h-[calc(100dvh-3.5rem-60px)] items-center justify-center md:h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar función"
        message={`¿Eliminar "${deleteTarget?.title}" del catálogo? Se quitará de cualquier operador.`}
        type="danger"
        onConfirm={confirmDeleteDuty}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        isOpen={!!unassignTarget}
        title="Desligar todas las funciones"
        message={`¿Quitar todas las funciones asignadas a ${unassignTarget?.name}? Quedarán en "Sin asignar".`}
        type="warning"
        onConfirm={confirmUnassignAll}
        onCancel={() => setUnassignTarget(null)}
      />

      <DiariosDutyFormDialog
        open={dutyFormOpen}
        onOpenChange={setDutyFormOpen}
        duty={editingDuty}
        operators={board.operators}
        initialOperatorIds={dutyFormAssignment.operatorIds}
        initialAssignToAll={dutyFormAssignment.assignToAll}
        initialIsGeneral={dutyFormAssignment.isGeneral}
        saving={saving}
        onSubmit={handleDutySubmit}
      />

      <DiariosTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        fromOperator={transferFrom}
        operators={board.operators}
        dutyCount={transferFrom ? (board.byOperator[transferFrom.id]?.length ?? 0) : 0}
        saving={saving}
        onConfirm={handleTransfer}
      />

      <div className="diarios-ui flex h-[calc(100dvh-3.5rem-60px)] flex-col overflow-hidden md:h-[calc(100dvh-3.5rem)]">
        <header className="diarios-toolbar shrink-0 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground md:text-base">
              Diarios
            </h1>
            <span className="hidden text-xs text-muted-foreground md:inline">
              · {board.duties.length} funciones · {board.operators.length} personas
            </span>
            <div className="flex-1" />
            {canEdit && (
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-[3px] bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
                onClick={openCreateDuty}
                disabled={saving}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva función
              </Button>
            )}
          </div>
        </header>

        {board.operators.length > 0 && (
          <DiariosMobileColumnPicker
            operators={board.operators}
            selectedId={mobileOperatorId}
            dutyCounts={operatorDutyCounts}
            onSelect={handleMobileSelect}
          />
        )}

        {board.operators.length === 0 && !canEdit ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="max-w-md text-center text-sm text-muted-foreground">
              No hay perfiles en el tablero. Agregue usuarios (operador o admin) en
              configuración.
            </p>
          </div>
        ) : (
          <>
            <div
              className="diarios-board hidden min-h-0 flex-1 md:block"
              role="region"
              aria-label="Tablero de funciones"
            >
              <div className="diarios-board-track" role="list" aria-label="Columnas del tablero">
                {canEdit && (
                  <DiariosUnassignedPanel
                    duties={board.unassigned}
                    operators={board.operators}
                    dutySharedCounts={dutySharedCounts}
                    canEdit={canEdit}
                    draggingDutyId={draggingDutyId}
                    dragSourceUserId={dragSource?.userId}
                    onDropUnassigned={(dutyId) =>
                      handleAssign(dutyId, null, dragSource?.userId ?? undefined)
                    }
                    onReorderAtIndex={(id, idx) => handleReorderAtIndex(null, id, idx)}
                    onMoveUp={(id) => handleMoveUp(null, id)}
                    onMoveDown={(id) => handleMoveDown(null, id)}
                    onPriorityChange={handlePriorityChange}
                    onMoveDutyTo={(id, uid) => handleMoveDutyTo(id, uid, null)}
                    onEditDuty={openEditDuty}
                    onDeleteDuty={setDeleteTarget}
                    onAddDuty={openCreateDuty}
                    onDragStartDuty={(dutyId) => {
                      setDraggingDutyId(dutyId);
                      setDragSource({ dutyId, userId: null });
                    }}
                    onDragEnd={endDrag}
                  />
                )}
                {board.operators.map((op) => (
                  <DiariosOperatorColumn
                    key={op.id}
                    operator={op}
                    operators={board.operators}
                    duties={board.byOperator[op.id] ?? []}
                    dutySharedCounts={dutySharedCounts}
                    canEdit={canEdit}
                    draggingDutyId={draggingDutyId}
                    dragSourceUserId={dragSource?.userId}
                    onDropDuty={(dutyId, toUserId) =>
                      handleAssign(dutyId, toUserId, dragSource?.userId ?? undefined)
                    }
                    onReorderAtIndex={(id, idx) => handleReorderAtIndex(op.id, id, idx)}
                    onMoveUp={(id) => handleMoveUp(op.id, id)}
                    onMoveDown={(id) => handleMoveDown(op.id, id)}
                    onPriorityChange={handlePriorityChange}
                    onMoveDutyTo={(id, uid) => handleMoveDutyTo(id, uid, op.id)}
                    onEditDuty={openEditDuty}
                    onDeleteDuty={setDeleteTarget}
                    onUnassignAll={() => setUnassignTarget(op)}
                    onDelegateAll={() => {
                      setTransferFrom(op);
                      setTransferOpen(true);
                    }}
                    onDragStartDuty={(dutyId, fromUserId) => {
                      setDraggingDutyId(dutyId);
                      setDragSource({ dutyId, userId: fromUserId });
                    }}
                    onDragEnd={endDrag}
                  />
                ))}
              </div>
            </div>

            <div
              className="diarios-board-mobile flex min-h-0 flex-1 flex-col overflow-hidden md:hidden"
              role="region"
              aria-label="Tablero móvil"
            >
              <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2 pt-1">
                {canEdit && (
                  <DiariosUnassignedPanel
                    duties={board.unassigned}
                    operators={board.operators}
                    dutySharedCounts={dutySharedCounts}
                    canEdit={canEdit}
                    draggingDutyId={draggingDutyId}
                    dragSourceUserId={dragSource?.userId}
                    onDropUnassigned={(dutyId) =>
                      handleAssign(dutyId, null, dragSource?.userId ?? undefined)
                    }
                    onReorderAtIndex={(id, idx) => handleReorderAtIndex(null, id, idx)}
                    onMoveUp={(id) => handleMoveUp(null, id)}
                    onMoveDown={(id) => handleMoveDown(null, id)}
                    onPriorityChange={handlePriorityChange}
                    onMoveDutyTo={(id, uid) => handleMoveDutyTo(id, uid, null)}
                    onEditDuty={openEditDuty}
                    onDeleteDuty={setDeleteTarget}
                    onAddDuty={openCreateDuty}
                    onDragStartDuty={(dutyId) => {
                      setDraggingDutyId(dutyId);
                      setDragSource({ dutyId, userId: null });
                    }}
                    onDragEnd={endDrag}
                  />
                )}
                {board.operators.map((op) => {
                  const isActive = op.id === mobileOperatorId;
                  return (
                    <div
                      key={op.id}
                      id={`diarios-panel-${op.id}`}
                      role="tabpanel"
                      aria-labelledby={`diarios-tab-${op.id}`}
                      className={cn(
                        "flex min-h-0 min-w-0 flex-1 flex-col",
                        !isActive && "hidden"
                      )}
                    >
                      <DiariosOperatorColumn
                        operator={op}
                        operators={board.operators}
                        duties={board.byOperator[op.id] ?? []}
                        dutySharedCounts={dutySharedCounts}
                        canEdit={canEdit}
                        draggingDutyId={draggingDutyId}
                        dragSourceUserId={dragSource?.userId}
                        fullWidth
                        onDropDuty={(dutyId, toUserId) =>
                          handleAssign(dutyId, toUserId, dragSource?.userId ?? undefined)
                        }
                        onReorderAtIndex={(id, idx) =>
                          handleReorderAtIndex(op.id, id, idx)
                        }
                        onMoveUp={(id) => handleMoveUp(op.id, id)}
                        onMoveDown={(id) => handleMoveDown(op.id, id)}
                        onPriorityChange={handlePriorityChange}
                        onMoveDutyTo={(id, uid) => handleMoveDutyTo(id, uid, op.id)}
                        onEditDuty={openEditDuty}
                        onDeleteDuty={setDeleteTarget}
                        onUnassignAll={() => setUnassignTarget(op)}
                        onDelegateAll={() => {
                          setTransferFrom(op);
                          setTransferOpen(true);
                        }}
                        onDragStartDuty={(dutyId, fromUserId) => {
                          setDraggingDutyId(dutyId);
                          setDragSource({ dutyId, userId: fromUserId });
                        }}
                        onDragEnd={endDrag}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!canEdit && board.unassigned.length > 0 && (
          <div className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-2 md:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sin asignar ({board.unassigned.length})
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {board.unassigned.map((d) => d.title).join(" · ")}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
