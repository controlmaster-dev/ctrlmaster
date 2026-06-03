"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  DiariosDutyFormDialog,
  type DiariosDutyFormPayload,
} from "@/components/diarios/DiariosDutyFormDialog";
import { DiariosOperatorColumn } from "@/components/diarios/DiariosOperatorColumn";
import { DiariosTransferDialog } from "@/components/diarios/DiariosTransferDialog";
import { DiariosUnassignedPanel } from "@/components/diarios/DiariosUnassignedPanel";
import { useDiariosBoard } from "@/hooks/useDiariosBoard";
import { pageContainerClass } from "@/lib/page-layout";
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
  } = useDiariosBoard(!!user);

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

  const boardColumnCount = board.operators.length + (canEdit ? 1 : 0);

  const boardGridStyle = useMemo(
    () =>
      ({
        ["--diarios-cols" as string]: Math.max(boardColumnCount, 1),
      }) as React.CSSProperties,
    [boardColumnCount]
  );

  const handleAssign = async (
    dutyId: string,
    userId: string | null,
    fromUserId?: string | null
  ) => {
    const ok = await assignDuty(dutyId, userId, fromUserId);
    if (!ok) toast.error("No se pudo mover la función");
    setDragSource(null);
  };

  const dutyFormAssignment = useMemo(() => {
    if (!editingDuty) {
      return { operatorIds: [] as string[], assignToAll: false };
    }
    const operatorIds = board.assignments
      .filter((a) => a.dutyId === editingDuty.id)
      .map((a) => a.userId);
    const allIds = board.operators.map((o) => o.id);
    const assignToAll =
      allIds.length > 0 &&
      allIds.length === operatorIds.length &&
      allIds.every((id) => operatorIds.includes(id));
    return { operatorIds, assignToAll };
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
      <div className={`${pageContainerClass} flex min-h-[50vh] items-center justify-center`}>
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

      <div className={`${pageContainerClass} space-y-5`}>
        <BentoCard className="p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div>
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Diarios</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Funciones obligatorias de cada operador en Control Máster.{" "}
                  {canEdit
                    ? "Arrastre tarjetas entre columnas, desligue o delegue al salir de un puesto."
                    : "Consulte su perfil y las responsabilidades del equipo."}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {board.duties.length} en catálogo · {totalAssigned} asignaciones ·{" "}
                {board.unassigned.length} sin asignar · {board.operators.length} perfiles
              </p>
            </div>
            {canEdit && (
              <Button
                className="h-9 shrink-0 gap-2 bg-brand text-white hover:bg-brand-hover"
                onClick={openCreateDuty}
                disabled={saving}
              >
                <Plus className="h-4 w-4" />
                Nueva función
              </Button>
            )}
          </div>
        </BentoCard>

        <BentoCard className="overflow-hidden p-2 md:p-3">
          {board.operators.length === 0 && !canEdit ? (
            <div className="flex min-h-[200px] items-center justify-center p-8">
              <p className="text-center text-sm text-muted-foreground">
                No hay perfiles en el tablero. Agregue usuarios (operador o admin) en
                configuración.
              </p>
            </div>
          ) : (
            <div
              className="diarios-board-grid"
              style={boardGridStyle}
              role="list"
              aria-label="Tablero de funciones por persona"
            >
              {canEdit && (
                <DiariosUnassignedPanel
                  duties={board.unassigned}
                  dutySharedCounts={dutySharedCounts}
                  canEdit={canEdit}
                  draggingDutyId={draggingDutyId}
                  onDropUnassigned={(dutyId) =>
                    handleAssign(dutyId, null, dragSource?.userId ?? undefined)
                  }
                  onEditDuty={openEditDuty}
                  onDeleteDuty={setDeleteTarget}
                  onDragStartDuty={(dutyId) => {
                    setDraggingDutyId(dutyId);
                    setDragSource({ dutyId, userId: null });
                  }}
                  onDragEnd={() => {
                    setDraggingDutyId(null);
                    setDragSource(null);
                  }}
                />
              )}
              {board.operators.map((op) => (
                <DiariosOperatorColumn
                  key={op.id}
                  operator={op}
                  duties={board.byOperator[op.id] ?? []}
                  dutySharedCounts={dutySharedCounts}
                  canEdit={canEdit}
                  isCurrentUser={currentUserId === op.id}
                  draggingDutyId={draggingDutyId}
                  onDropDuty={(dutyId, toUserId) =>
                    handleAssign(dutyId, toUserId, dragSource?.userId ?? undefined)
                  }
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
                  onDragEnd={() => {
                    setDraggingDutyId(null);
                    setDragSource(null);
                  }}
                />
              ))}
            </div>
          )}
        </BentoCard>

          {!canEdit && board.unassigned.length > 0 && (
            <BentoCard className="p-4 lg:hidden">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sin asignar ({board.unassigned.length})
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {board.unassigned.map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
              </ul>
            </BentoCard>
          )}
      </div>
    </>
  );
}
