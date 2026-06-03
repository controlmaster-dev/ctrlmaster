"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiariosOperator } from "@/types/operatorDuty";

type DiariosTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromOperator: DiariosOperator | null;
  operators: DiariosOperator[];
  dutyCount: number;
  saving?: boolean;
  onConfirm: (toUserId: string) => Promise<boolean>;
};

export function DiariosTransferDialog({
  open,
  onOpenChange,
  fromOperator,
  operators,
  dutyCount,
  saving,
  onConfirm,
}: DiariosTransferDialogProps) {
  const [toUserId, setToUserId] = useState("");

  const targets = operators.filter((o) => o.id !== fromOperator?.id);

  const handleConfirm = async () => {
    if (!toUserId) return;
    const ok = await onConfirm(toUserId);
    if (ok) {
      setToUserId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setToUserId("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delegar funciones</DialogTitle>
          <DialogDescription>
            Mover las {dutyCount} funciones de{" "}
            <span className="font-medium text-foreground">{fromOperator?.name}</span> a otro
            operador (por ejemplo, si se despide o cambia de área).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Nuevo responsable</Label>
          <Select value={toUserId} onValueChange={setToUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar operador" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!toUserId || saving} onClick={handleConfirm}>
            Delegar todas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
