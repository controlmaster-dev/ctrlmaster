"use client";

import {
  ArrowDown,
  ArrowUp,
  Globe2,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DIARIOS_PRIORITY_OPTIONS,
  type DiariosPriority,
  getDiariosPriorityMeta,
} from "@/lib/diariosPriority";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

const DRAG_TYPE = "application/x-operator-duty";

export function getDutyDragType() {
  return DRAG_TYPE;
}

type DiariosDutyCardProps = {
  duty: OperatorDuty;
  sharedCount?: number;
  canEdit: boolean;
  sortIndex?: number;
  sortCount?: number;
  operators?: DiariosOperator[];
  columnUserId?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDragStart?: (dutyId: string) => void;
  onDragEnd?: () => void;
  onDropAtIndex?: (dutyId: string, index: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPriorityChange?: (priority: DiariosPriority) => void;
  onMoveTo?: (userId: string | null) => void;
  dragging?: boolean;
};

export function DiariosDutyCard({
  duty,
  sharedCount,
  canEdit,
  sortIndex = 0,
  sortCount = 1,
  operators = [],
  columnUserId,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropAtIndex,
  onMoveUp,
  onMoveDown,
  onPriorityChange,
  onMoveTo,
  dragging,
}: DiariosDutyCardProps) {
  const isShared = sharedCount != null && sharedCount > 1;
  const priorityMeta = getDiariosPriorityMeta(duty.priority);
  const canMoveUp = sortIndex > 0;
  const canMoveDown = sortIndex < sortCount - 1;

  const handleCardDragOver = (e: React.DragEvent) => {
    if (!canEdit || !onDropAtIndex) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCardDrop = (e: React.DragEvent) => {
    if (!canEdit || !onDropAtIndex) return;
    e.preventDefault();
    e.stopPropagation();
    const id = readDutyDragId(e);
    if (id) onDropAtIndex(id, sortIndex);
    onDragEnd?.();
  };

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
      onDragOver={handleCardDragOver}
      onDrop={handleCardDrop}
      className={cn(
        "diarios-card group relative pl-2.5 pr-2 py-2 transition-shadow",
        priorityMeta.cardClass,
        canEdit && "cursor-grab touch-manipulation active:cursor-grabbing",
        dragging && "diarios-card--dragging"
      )}
      data-priority={duty.priority}
    >
      <div className="flex items-start gap-1.5">
        {canEdit && (
          <GripVertical
            className="mt-0.5 hidden h-4 w-4 shrink-0 text-[var(--diarios-card-muted)] opacity-0 sm:block group-hover:opacity-100"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] font-medium leading-snug text-[var(--diarios-card-fg)]"
            title={duty.title}
          >
            {duty.title}
          </p>
          {duty.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--diarios-card-muted)]">
              {duty.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {duty.isGeneral && (
              <span className="inline-flex items-center gap-0.5 rounded-[3px] bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-brand">
                <Globe2 className="h-3 w-3 shrink-0" />
                General
              </span>
            )}
            {canEdit && onPriorityChange ? (
              <Select
                value={duty.priority}
                onValueChange={(v) => onPriorityChange(v as DiariosPriority)}
              >
                <SelectTrigger
                  className={cn(
                    "h-5 w-auto min-w-0 gap-0.5 rounded-[3px] border-0 px-1.5 text-[10px] font-semibold leading-none shadow-none focus:ring-0",
                    priorityMeta.badgeClass
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {DIARIOS_PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span
                className={cn(
                  "inline-flex rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  priorityMeta.badgeClass
                )}
              >
                {priorityMeta.label}
              </span>
            )}
            {isShared && (
              <span className="inline-flex items-center gap-0.5 rounded-[3px] bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--diarios-card-muted)] dark:bg-white/10">
                <Users className="h-3 w-3 shrink-0" />
                {sharedCount}
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <div className="flex gap-0.5 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canMoveUp}
                aria-label="Subir"
                onClick={onMoveUp}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canMoveDown}
                aria-label="Bajar"
                onClick={onMoveDown}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Más acciones"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {onMoveTo && operators.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Mover a…</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-56 overflow-y-auto">
                      {columnUserId !== null && (
                        <DropdownMenuItem onClick={() => onMoveTo(null)}>
                          Sin asignar
                        </DropdownMenuItem>
                      )}
                      {operators.map((op) => (
                        <DropdownMenuItem
                          key={op.id}
                          disabled={op.id === columnUserId}
                          onClick={() => onMoveTo(op.id)}
                        >
                          {op.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
                  Orden
                </DropdownMenuLabel>
                <DropdownMenuItem disabled={!canMoveUp} onClick={onMoveUp}>
                  Subir en la lista
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onClick={onMoveDown}>
                  Bajar en la lista
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
