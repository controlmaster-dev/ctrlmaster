"use client";

import { useState } from "react";
import { MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DiariosDutyCard, readDutyDragId } from "@/components/diarios/DiariosDutyCard";
import type { DiariosPriority } from "@/lib/diariosPriority";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

type DiariosOperatorColumnProps = {
  operator: DiariosOperator;
  duties: OperatorDuty[];
  operators: DiariosOperator[];
  dutySharedCounts?: Record<string, number>;
  canEdit: boolean;
  draggingDutyId: string | null;
  dragSourceUserId?: string | null;
  fullWidth?: boolean;
  onDropDuty: (dutyId: string, toUserId: string) => void;
  onReorderAtIndex: (draggedId: string, toIndex: number) => void;
  onMoveUp: (dutyId: string) => void;
  onMoveDown: (dutyId: string) => void;
  onPriorityChange: (dutyId: string, priority: DiariosPriority) => void;
  onMoveDutyTo: (dutyId: string, userId: string | null) => void;
  onDragStartDuty: (dutyId: string, fromUserId: string) => void;
  onEditDuty: (duty: OperatorDuty) => void;
  onDeleteDuty: (duty: OperatorDuty) => void;
  onUnassignAll: () => void;
  onDelegateAll: () => void;
  onDragEnd: () => void;
};

export function DiariosOperatorColumn({
  operator,
  duties,
  operators,
  dutySharedCounts,
  canEdit,
  draggingDutyId,
  dragSourceUserId,
  fullWidth,
  onDropDuty,
  onReorderAtIndex,
  onMoveUp,
  onMoveDown,
  onPriorityChange,
  onMoveDutyTo,
  onEditDuty,
  onDeleteDuty,
  onUnassignAll,
  onDelegateAll,
  onDragStartDuty,
  onDragEnd,
}: DiariosOperatorColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOver(false);
    const dutyId = readDutyDragId(e);
    if (!dutyId) return;
    if (dragSourceUserId === operator.id) {
      onReorderAtIndex(dutyId, duties.length);
    } else {
      onDropDuty(dutyId, operator.id);
    }
    onDragEnd();
  };

  const handleDropAtIndex = (draggedId: string, index: number) => {
    if (dragSourceUserId === operator.id) {
      onReorderAtIndex(draggedId, index);
    } else {
      onDropDuty(draggedId, operator.id);
    }
  };

  return (
    <section
      className={cn(
        "diarios-column",
        fullWidth && "diarios-column--mobile-full",
        dragOver && canEdit && "diarios-column--drag-over"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleColumnDrop}
      aria-label={`Columna de ${operator.name}`}
    >
      <div className="diarios-column-header flex items-center gap-1">
        <div className="min-w-0 flex-1 px-1">
          <p className="diarios-column-title truncate" title={operator.name}>
            {operator.name}
          </p>
          <p className="diarios-column-meta">
            {duties.length} {duties.length === 1 ? "tarjeta" : "tarjetas"}
          </p>
        </div>
        {canEdit && duties.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-md text-[var(--diarios-list-muted)] hover:bg-black/5 hover:text-[var(--diarios-list-fg)] dark:hover:bg-white/10"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onDelegateAll} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Delegar todas a…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onUnassignAll}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <UserMinus className="h-4 w-4" />
                Desligar todas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="diarios-column-body">
        {duties.length === 0 ? (
          <div
            className={cn(
              "diarios-dropzone flex flex-1 flex-col items-center justify-center px-3 py-10 text-center",
              dragOver && canEdit && "diarios-dropzone--active"
            )}
          >
            <p className="text-xs leading-relaxed text-[var(--diarios-list-muted)]">
              {canEdit ? "Suelte una tarjeta aquí" : "Sin funciones"}
            </p>
          </div>
        ) : (
          duties.map((duty, index) => (
            <DiariosDutyCard
              key={`${duty.id}-${index}`}
              duty={duty}
              sharedCount={dutySharedCounts?.[duty.id]}
              canEdit={canEdit}
              sortIndex={index}
              sortCount={duties.length}
              operators={operators}
              columnUserId={operator.id}
              dragging={draggingDutyId === duty.id}
              onDragStart={() => onDragStartDuty(duty.id, operator.id)}
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
      </div>
    </section>
  );
}
