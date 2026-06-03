"use client";

import { GripVertical, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

const DRAG_TYPE = "application/x-operator-duty";

export function getDutyDragType() {
  return DRAG_TYPE;
}

type DiariosDutyCardProps = {
  duty: OperatorDuty;
  sharedCount?: number;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDragStart?: (dutyId: string) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
};

export function DiariosDutyCard({
  duty,
  sharedCount,
  canEdit,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  dragging,
}: DiariosDutyCardProps) {
  const isShared = sharedCount != null && sharedCount > 1;

  return (
    <article
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        e.dataTransfer.setData(DRAG_TYPE, duty.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(duty.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "group relative rounded-lg border border-border/70 bg-card px-2.5 py-2.5 shadow-sm transition-all",
        canEdit && "cursor-grab active:cursor-grabbing active:shadow-md",
        dragging && "rotate-[1deg] opacity-60 ring-2 ring-brand/40 shadow-md",
        canEdit && "hover:border-foreground/25 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        {canEdit && (
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground" title={duty.title}>
            {duty.title}
          </p>
          {duty.description ? (
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {duty.description}
            </p>
          ) : null}
          {isShared && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              {sharedCount} personas
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar función"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label="Eliminar función"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export function readDutyDragId(e: React.DragEvent): string | null {
  const id = e.dataTransfer.getData(getDutyDragType());
  return id || null;
}
