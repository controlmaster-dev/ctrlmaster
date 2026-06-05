"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiariosDutyCard, readDutyDragId } from "@/components/diarios/DiariosDutyCard";
import type { DiariosPriority } from "@/lib/diariosPriority";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

type DiariosUnassignedPanelProps = {
  duties: OperatorDuty[];
  operators: DiariosOperator[];
  dutySharedCounts?: Record<string, number>;
  canEdit: boolean;
  draggingDutyId: string | null;
  dragSourceUserId?: string | null;
  onDropUnassigned: (dutyId: string) => void;
  onReorderAtIndex: (draggedId: string, toIndex: number) => void;
  onMoveUp: (dutyId: string) => void;
  onMoveDown: (dutyId: string) => void;
  onPriorityChange: (dutyId: string, priority: DiariosPriority) => void;
  onMoveDutyTo: (dutyId: string, userId: string | null) => void;
  onDragStartDuty: (dutyId: string) => void;
  onEditDuty: (duty: OperatorDuty) => void;
  onDeleteDuty: (duty: OperatorDuty) => void;
  onAddDuty?: () => void;
  onDragEnd: () => void;
};

export function DiariosUnassignedPanel({
  duties,
  operators,
  dutySharedCounts,
  canEdit,
  draggingDutyId,
  dragSourceUserId,
  onDropUnassigned,
  onReorderAtIndex,
  onMoveUp,
  onMoveDown,
  onPriorityChange,
  onMoveDutyTo,
  onEditDuty,
  onDeleteDuty,
  onAddDuty,
  onDragStartDuty,
  onDragEnd,
}: DiariosUnassignedPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!draggingDutyId) setDragOver(false);
  }, [draggingDutyId]);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
    if (!expanded) setExpanded(true);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOver(false);
    const dutyId = readDutyDragId(e);
    if (!dutyId) return;
    if (dragSourceUserId === null) {
      onReorderAtIndex(dutyId, duties.length);
    } else {
      onDropUnassigned(dutyId);
    }
    onDragEnd();
  };

  const handleDropAtIndex = (draggedId: string, index: number) => {
    if (dragSourceUserId === null) {
      onReorderAtIndex(draggedId, index);
    } else {
      onDropUnassigned(draggedId);
    }
  };

  const count = duties.length;

  return (
    <section
      className={cn(
        "diarios-column diarios-column--unassigned",
        !expanded && "diarios-column--collapsed",
        dragOver && canEdit && "diarios-column--drag-over"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleColumnDrop}
      aria-label="Sin asignar"
    >
      <div
        className={cn(
          "diarios-column-header flex",
          expanded ? "items-center gap-2" : "flex-col items-center gap-2 py-3"
        )}
      >
        {expanded ? (
          <>
            <div className="min-w-0 flex-1 px-1">
              <p className="diarios-column-title">Sin asignar</p>
              <p className="diarios-column-meta">{count} en catálogo libre</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Ocultar sin asignar"
              aria-expanded={expanded}
              onClick={() => setExpanded(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Mostrar sin asignar"
              aria-expanded={expanded}
              onClick={() => setExpanded(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-dashed border-border/80 bg-background/80">
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
            {count > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-[3px] bg-brand px-1 text-[10px] font-bold text-white"
                title={`${count} sin asignar`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
            <span
              className="max-h-[min(40vh,12rem)] overflow-hidden text-[10px] font-semibold uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl]"
              title="Sin asignar"
            >
              Sin asignar
            </span>
          </>
        )}
      </div>

      {expanded && (
        <div className="diarios-column-body">
          {count === 0 ? (
            <div
              className={cn(
                "diarios-dropzone flex flex-1 flex-col items-center justify-center px-3 py-10 text-center",
                dragOver && canEdit && "diarios-dropzone--active"
              )}
            >
              <p className="text-xs leading-relaxed text-[var(--diarios-list-muted)]">
                Arrastre aquí para desligar o cree una función nueva
              </p>
            </div>
          ) : (
            duties.map((duty, index) => (
              <DiariosDutyCard
                key={duty.id}
                duty={duty}
                sharedCount={dutySharedCounts?.[duty.id]}
                canEdit={canEdit}
                sortIndex={index}
                sortCount={duties.length}
                operators={operators}
                columnUserId={null}
                dragging={draggingDutyId === duty.id}
                onDragStart={() => onDragStartDuty(duty.id)}
                onDragEnd={onDragEnd}
                onDropAtIndex={canEdit ? handleDropAtIndex : undefined}
                onMoveUp={() => onMoveUp(duty.id)}
                onMoveDown={() => onMoveDown(duty.id)}
                onPriorityChange={(p) => onPriorityChange(duty.id, p)}
                onMoveTo={(userId) => onMoveDutyTo(duty.id, userId)}
                onEdit={() => onEditDuty(duty)}
                onDelete={() => onDeleteDuty(duty)}
              />
            ))
          )}

          {canEdit && onAddDuty && (
            <Button
              type="button"
              variant="ghost"
              className="diarios-btn-ghost h-8 w-full justify-start gap-2 text-[var(--diarios-list-muted)] hover:bg-black/5 hover:text-[var(--diarios-list-fg)] dark:hover:bg-white/10"
              onClick={onAddDuty}
            >
              <Plus className="h-4 w-4" />
              Añadir función
            </Button>
          )}
        </div>
      )}

      {!expanded && canEdit && dragOver && (
        <div className="diarios-dropzone diarios-dropzone--active mx-1 mb-2 flex flex-1 items-center justify-center px-1 py-4">
          <p className="text-center text-[9px] font-medium leading-tight text-brand">Soltar</p>
        </div>
      )}
    </section>
  );
}
