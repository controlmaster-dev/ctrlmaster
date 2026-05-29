"use client";

import { UserPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import type { Shift } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: string;
  schedule: Shift[];
  birthday: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  user: UserFormState;
  onChange: (user: UserFormState) => void;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const MONTHS = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
];

export function UserFormDialog({
  open,
  onOpenChange,
  isEditing,
  user,
  onChange,
  error,
  onSubmit,
  onCancel,
}: UserFormDialogProps) {
  const patch = (partial: Partial<UserFormState>) => onChange({ ...user, ...partial });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "configuracion-ui gap-0 overflow-hidden p-0 sm:rounded-lg",
          "!left-1/2 !top-[calc(3.5rem+0.5rem)] !max-w-[68rem] w-[min(calc(100vw-1.5rem),68rem)] !-translate-x-1/2 !translate-y-0",
          "grid !h-[calc(100dvh-3.5rem-1rem)] !max-h-[calc(100dvh-3.5rem-1rem)]",
          "grid-rows-[auto_minmax(0,1fr)_auto]"
        )}
      >
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-4 pr-12 text-left sm:px-8">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {isEditing ? (
              <Settings className="h-5 w-5 shrink-0 text-brand" />
            ) : (
              <UserPlus className="h-5 w-5 shrink-0 text-brand" />
            )}
            {isEditing ? "Editar operador" : "Nuevo operador"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Datos de acceso, cumpleaños y turnos semanales.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8">
          <form id="user-form" onSubmit={onSubmit} className="space-y-6">
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Datos personales</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Nombre completo</Label>
                  <Input
                    id="user-name"
                    value={user.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Correo</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={user.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="usuario@enlace.org"
                    className="h-10"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Acceso</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <Select value={user.role} onValueChange={(val) => patch({ role: val })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATOR">Operador</SelectItem>
                      <SelectItem value="ENGINEER">Ingeniero</SelectItem>
                      <SelectItem value="BOSS">Coordinador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-password">
                    {isEditing ? "Nueva contraseña" : "Contraseña"}
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={user.password}
                    onChange={(e) => patch({ password: e.target.value })}
                    placeholder={
                      isEditing ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"
                    }
                    className="h-10"
                    required={!isEditing}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Cumpleaños</legend>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[140px] flex-1 space-y-1.5">
                  <Label>Mes</Label>
                  <Select
                    value={user.birthday ? user.birthday.split("-")[0] : undefined}
                    onValueChange={(m) => {
                      const d = user.birthday.split("-")[1] || "01";
                      patch({ birthday: `${m}-${d}` });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString("es-CR", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 shrink-0 space-y-1.5 sm:w-32">
                  <Label>Día</Label>
                  <Select
                    value={user.birthday ? user.birthday.split("-")[1] : undefined}
                    onValueChange={(d) => {
                      const m = user.birthday.split("-")[0] || "01";
                      patch({ birthday: `${m}-${d}` });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 31 }, (_, i) =>
                        (i + 1).toString().padStart(2, "0")
                      ).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 border-t border-border/60 pt-5 pb-1">
              <legend className="text-sm font-medium text-foreground">Turnos semanales</legend>
              <ScheduleEditor value={user.schedule} onChange={(s) => patch({ schedule: s })} />
            </fieldset>
          </form>
        </div>

        <div className="flex justify-end gap-3 border-t border-border/60 bg-card px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="user-form"
            className="bg-brand text-white hover:bg-brand-hover"
          >
            {isEditing ? "Guardar cambios" : "Crear operador"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
