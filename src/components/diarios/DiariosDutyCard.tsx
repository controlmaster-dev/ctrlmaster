"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
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
  compact?: boolean;
};

export function DiariosDutyCard({
  duty,
  sharedCount,
  canEdit,
  compact = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  dragging,
}: DiariosDutyCardProps) {
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        e.dataTransfer.setData(DRAG_TYPE, duty.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(duty.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "group rounded-md border border-border/80 bg-card shadow-sm transition-all",
        compact ? "p-1.5" : "p-3",
        canEdit && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-50 ring-1 ring-brand/40",
        canEdit && "hover:border-foreground/20"
      )}
    >
      <div className={cn("flex items-start", compact ? "gap-1" : "gap-2")}>
        {canEdit && !compact && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium leading-snug text-foreground",
              compact ? "line-clamp-3 text-[11px]" : "text-sm"
            )}
            title={duty.title}
          >
            {duty.title}
            {sharedCount && sharedCount > 1 ? (
              <span className="block text-[10px] font-normal text-muted-foreground">
                {sharedCount} personas
              </span>
            ) : null}
          </p>
          {!compact && duty.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {duty.description}
            </p>
          ) : null}
        </div>
        {canEdit && (
          <div
            className={cn(
              "flex shrink-0 gap-0.5",
              compact ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={compact ? "h-6 w-6" : "h-7 w-7"}
              aria-label="Editar función"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "text-destructive hover:text-destructive",
                compact ? "h-6 w-6" : "h-7 w-7"
              )}
              aria-label="Eliminar función"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function readDutyDragId(e: React.DragEvent): string | null {
  const id = e.dataTransfer.getData(getDutyDragType());
  return id || null;
}
