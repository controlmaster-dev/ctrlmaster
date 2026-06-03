"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onAddDuty?: () => void;
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

  const handleDrop = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOver(false);
    const dutyId = readDutyDragId(e);
    if (dutyId) onDropUnassigned(dutyId);
    onDragEnd();
  };

  const count = duties.length;

  return (
    <section
      className={cn(
        "diarios-column diarios-column--unassigned",
        !expanded && "diarios-column--collapsed",
        dragOver && canEdit && "ring-2 ring-brand/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      aria-label="Sin asignar"
    >
      <div
        className={cn(
          "diarios-column-header flex bg-muted/50",
          expanded ? "items-center gap-2" : "flex-col items-center gap-2 py-3"
        )}
      >
        {expanded ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border/80 bg-background/80">
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Sin asignar</p>
              <p className="text-xs text-muted-foreground">{count} en catálogo libre</p>
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border/80 bg-background/80">
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
            {count > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white"
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
                "flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 px-3 py-10 text-center",
                dragOver && canEdit && "border-brand bg-brand/[0.04]"
              )}
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                Arrastre aquí para desligar o cree una función nueva
              </p>
            </div>
          ) : (
            duties.map((duty) => (
              <DiariosDutyCard
                key={duty.id}
                duty={duty}
                sharedCount={dutySharedCounts?.[duty.id]}
                canEdit={canEdit}
                dragging={draggingDutyId === duty.id}
                onDragStart={() => onDragStartDuty(duty.id)}
                onDragEnd={onDragEnd}
                onEdit={() => onEditDuty(duty)}
                onDelete={() => onDeleteDuty(duty)}
              />
            ))
          )}

          {canEdit && onAddDuty && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={onAddDuty}
            >
              <Plus className="h-4 w-4" />
              Añadir función
            </Button>
          )}
        </div>
      )}

      {!expanded && canEdit && dragOver && (
        <div className="mx-1 mb-2 flex flex-1 items-center justify-center rounded-md border border-dashed border-brand bg-brand/[0.06] px-1 py-4">
          <p className="text-center text-[9px] font-medium leading-tight text-brand">Soltar</p>
        </div>
      )}
    </section>
  );
}
