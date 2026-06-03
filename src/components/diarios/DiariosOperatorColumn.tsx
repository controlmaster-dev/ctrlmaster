"use client";

import { useState } from "react";
import { MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DiariosDutyCard, readDutyDragId } from "@/components/diarios/DiariosDutyCard";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";
import { getInitials } from "@/components/navbar/navConfig";

type DiariosOperatorColumnProps = {
  operator: DiariosOperator;
  duties: OperatorDuty[];
  dutySharedCounts?: Record<string, number>;
  canEdit: boolean;
  isCurrentUser?: boolean;
  draggingDutyId: string | null;
  onDropDuty: (dutyId: string, toUserId: string) => void;
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
  dutySharedCounts,
  canEdit,
  isCurrentUser,
  draggingDutyId,
  onDropDuty,
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

  const handleDrop = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOver(false);
    const dutyId = readDutyDragId(e);
    if (dutyId) onDropDuty(dutyId, operator.id);
    onDragEnd();
  };

  return (
    <section
      className={cn(
        "diarios-column",
        isCurrentUser && "ring-2 ring-brand/35",
        dragOver && canEdit && "ring-2 ring-brand/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      aria-label={`Columna de ${operator.name}`}
    >
      <div
        className={cn(
          "diarios-column-header flex items-start gap-2",
          isCurrentUser ? "bg-brand/8" : "bg-muted/40"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 border border-border/60 shadow-sm">
          <AvatarImage src={operator.image || ""} alt={operator.name} />
          <AvatarFallback className="text-[10px] font-semibold">
            {getInitials(operator.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className="truncate text-sm font-semibold leading-tight text-foreground"
            title={operator.name}
          >
            {operator.name}
            {isCurrentUser ? (
              <span className="ml-1 text-xs font-normal text-brand">(tú)</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {duties.length} {duties.length === 1 ? "tarjeta" : "tarjetas"}
          </p>
        </div>
        {canEdit && duties.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
              "flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 px-3 py-10 text-center",
              dragOver && canEdit && "border-brand bg-brand/[0.04]"
            )}
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              {canEdit ? "Suelte una tarjeta aquí" : "Sin funciones asignadas"}
            </p>
          </div>
        ) : (
          duties.map((duty, index) => (
            <DiariosDutyCard
              key={`${duty.id}-${index}`}
              duty={duty}
              sharedCount={dutySharedCounts?.[duty.id]}
              canEdit={canEdit}
              dragging={draggingDutyId === duty.id}
              onDragStart={() => onDragStartDuty(duty.id, operator.id)}
              onDragEnd={onDragEnd}
              onEdit={() => onEditDuty(duty)}
              onDelete={() => onDeleteDuty(duty)}
            />
          ))
        )}
      </div>
    </section>
  );
}
