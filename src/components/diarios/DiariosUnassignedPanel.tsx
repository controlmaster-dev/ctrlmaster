"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { DiariosDutyCard, readDutyDragId } from "@/components/diarios/DiariosDutyCard";
import type { OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

type DiariosUnassignedPanelProps = {
  duties: OperatorDuty[];
  dutySharedCounts?: Record<string, number>;
  canEdit: boolean;
  draggingDutyId: string | null;
  onDropUnassigned: (dutyId: string) => void;
  onDragStartDuty: (dutyId: string) => void;
  onEditDuty: (duty: OperatorDuty) => void;
  onDeleteDuty: (duty: OperatorDuty) => void;
  onDragEnd: () => void;
};

export function DiariosUnassignedPanel({
  duties,
  dutySharedCounts,
  canEdit,
  draggingDutyId,
  onDropUnassigned,
  onEditDuty,
  onDeleteDuty,
  onDragStartDuty,
  onDragEnd,
}: DiariosUnassignedPanelProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOver(false);
    const dutyId = readDutyDragId(e);
    if (dutyId) onDropUnassigned(dutyId);
    onDragEnd();
  };

  return (
    <div
      className={cn(
        "flex min-h-[140px] min-w-0 flex-col rounded-lg border border-dashed border-border/80 bg-muted/20",
        dragOver && canEdit && "border-brand bg-brand/[0.04]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-1.5 border-b border-border/60 px-2 py-2">
        <Inbox className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">Sin asignar</p>
          <p className="text-[10px] text-muted-foreground">{duties.length} disp.</p>
        </div>
      </div>
      <div className="flex max-h-[min(50vh,320px)] flex-col gap-1.5 overflow-y-auto p-1.5">
        {duties.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            {canEdit
              ? "Suelte aquí para desligar una función"
              : "No hay funciones pendientes"}
          </p>
        ) : (
          duties.map((duty) => (
            <DiariosDutyCard
              key={duty.id}
              duty={duty}
              sharedCount={dutySharedCounts?.[duty.id]}
              canEdit={canEdit}
              compact
              dragging={draggingDutyId === duty.id}
              onDragStart={() => onDragStartDuty(duty.id)}
              onDragEnd={onDragEnd}
              onEdit={() => onEditDuty(duty)}
              onDelete={() => onDeleteDuty(duty)}
            />
          ))
        )}
      </div>
    </div>
  );
}
