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
    <div
      className={cn(
        "flex min-h-[140px] min-w-0 flex-col rounded-lg border bg-card/50",
        isCurrentUser ? "border-brand/40 ring-1 ring-brand/20" : "border-border/80",
        dragOver && canEdit && "border-brand bg-brand/[0.03]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-start gap-1.5 border-b border-border/80 px-2 py-2">
        <Avatar className="h-6 w-6 shrink-0 border border-border/60">
          <AvatarImage src={operator.image || ""} alt={operator.name} />
          <AvatarFallback className="text-[8px] font-semibold">
            {getInitials(operator.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-medium leading-tight text-foreground"
            title={operator.name}
          >
            {operator.name}
          </p>
          <p className="truncate text-[10px] leading-tight text-muted-foreground">
            {duties.length} {duties.length === 1 ? "función" : "funciones"}
            {isCurrentUser ? " · tú" : ""}
          </p>
        </div>
        {canEdit && duties.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
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

      <div className="flex min-h-[80px] flex-1 flex-col gap-1.5 overflow-y-auto p-1.5">
        {duties.length === 0 ? (
          <p className="px-1 py-4 text-center text-[10px] leading-snug text-muted-foreground">
            {canEdit ? "Arrastre funciones aquí" : "Sin funciones asignadas"}
          </p>
        ) : (
          duties.map((duty, index) => (
            <DiariosDutyCard
              key={`${duty.id}-${index}`}
              duty={duty}
              sharedCount={dutySharedCounts?.[duty.id]}
              canEdit={canEdit}
              compact
              dragging={draggingDutyId === duty.id}
              onDragStart={() => onDragStartDuty(duty.id, operator.id)}
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
