"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { DiariosOperator, OperatorDuty } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

export type DiariosDutyFormPayload = {
  title: string;
  description: string;
  assignToAll: boolean;
  operatorIds: string[];
};

type DiariosDutyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duty?: OperatorDuty | null;
  operators: DiariosOperator[];
  initialOperatorIds?: string[];
  initialAssignToAll?: boolean;
  saving?: boolean;
  onSubmit: (data: DiariosDutyFormPayload) => Promise<boolean>;
};

export function DiariosDutyFormDialog({
  open,
  onOpenChange,
  duty,
  operators,
  initialOperatorIds = [],
  initialAssignToAll = false,
  saving,
  onSubmit,
}: DiariosDutyFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignToAll, setAssignToAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setTitle(duty?.title ?? "");
    setDescription(duty?.description ?? "");
    setAssignToAll(initialAssignToAll);
    setSelectedIds(new Set(initialOperatorIds));
  }, [open, duty, initialAssignToAll, initialOperatorIds]);

  const effectiveIds = useMemo(() => {
    if (assignToAll) return operators.map((o) => o.id);
    return Array.from(selectedIds);
  }, [assignToAll, operators, selectedIds]);

  const toggleOperator = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      assignToAll,
      operatorIds: effectiveIds,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{duty ? "Editar función" : "Nueva función"}</DialogTitle>
            <DialogDescription>
              Defina la responsabilidad y asígnela a todo el equipo (operadores y admins) o solo a algunas personas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duty-title">Nombre</Label>
              <Input
                id="duty-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Revisión de señales Enlace"
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duty-desc">Descripción (opcional)</Label>
              <Textarea
                id="duty-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle breve de la tarea…"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>

            <div className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Asignación
              </p>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={assignToAll}
                  onCheckedChange={(v) => setAssignToAll(v === true)}
                  disabled={operators.length === 0}
                />
                <span className="text-sm text-foreground">Aplicar a todo el equipo</span>
              </label>
              {operators.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay perfiles en el tablero.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {assignToAll
                      ? `Se asignará a ${operators.length} persona(s).`
                      : "O seleccione personas específicas:"}
                  </p>
                  <div
                    className={cn(
                      "flex max-h-40 flex-col gap-1 overflow-y-auto",
                      assignToAll && "pointer-events-none opacity-50"
                    )}
                  >
                    {operators.map((op) => (
                      <label
                        key={op.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={assignToAll || selectedIds.has(op.id)}
                          onCheckedChange={() => toggleOperator(op.id)}
                          disabled={assignToAll}
                        />
                        <span className="text-sm text-foreground">{op.name}</span>
                      </label>
                    ))}
                  </div>
                  {!assignToAll && effectiveIds.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Sin selección: la función quedará en «Sin asignar».
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {duty ? "Guardar" : "Crear función"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
