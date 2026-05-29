import { Dispatch, SetStateAction } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Edit2, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import type {
  BitcentralBaseDay,
  BitcentralEvent,
} from "@/lib/bitcentralCache";
import { dayUserId } from "@/components/bitcentral/bitcentralUtils";

type BitcentralUserOption = {
  id: string;
  name: string;
};

type ConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configDraft: Record<number, string>;
  setConfigDraft: Dispatch<SetStateAction<Record<number, string>>>;
  baseSchedule: BitcentralBaseDay[];
  users: BitcentralUserOption[];
  isSaving: boolean;
  onSave: (updates: Array<{ dayOfWeek: number; userId: string }>) => void;
};

type OverrideDialogProps = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  users: BitcentralUserOption[];
  isSaving: boolean;
  onOverride: (userId: string) => void;
};

type EventsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: BitcentralEvent[];
  newEventName: string;
  setNewEventName: (value: string) => void;
  newEventStart: Date;
  setNewEventStart: (value: Date) => void;
  newEventEnd: Date;
  setNewEventEnd: (value: Date) => void;
  isSaving: boolean;
  onCreateEvent: () => void;
  onDeleteEvent: (id: string) => void;
};

export function BitcentralConfigDialog({
  open,
  onOpenChange,
  configDraft,
  setConfigDraft,
  baseSchedule,
  users,
  isSaving,
  onSave,
}: ConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!left-1/2 !top-[calc(3.5rem+0.5rem)] !max-w-xl w-[min(calc(100vw-2rem),36rem)] !-translate-x-1/2 !translate-y-0 gap-0 overflow-hidden border border-border bg-background/95 p-0 shadow-xl backdrop-blur-2xl sm:rounded-sm">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-blue-500" />
            Configuración de Horario Base
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(60vh,calc(100dvh-10rem))] space-y-4 overflow-y-auto px-6 py-4 custom-scrollbar">
          <p className="text-sm text-muted-foreground">
            Define el operador predeterminado para cada día de la semana. Los
            cambios aplicarán a todas las semanas futuras excepto donde haya
            modificaciones manuales.
          </p>
          <form
            id="bitcentral-config-form"
            onSubmit={(event) => {
              event.preventDefault();
              const updates: Array<{ dayOfWeek: number; userId: string }> = [];
              for (let i = 0; i < 7; i++) {
                const userId = configDraft[i] ?? "default";
                const hadAssignment = baseSchedule.some((item) => item.dayOfWeek === i);
                if (userId === "default") {
                  if (hadAssignment) updates.push({ dayOfWeek: i, userId: "REMOVE" });
                } else {
                  updates.push({ dayOfWeek: i, userId });
                }
              }
              onSave(updates);
            }}
            className="space-y-3"
          >
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
              const dayName = format(
                addDays(
                  startOfWeek(new Date(), { weekStartsOn: 1 }),
                  dayIndex === 0 ? 6 : dayIndex - 1
                ),
                "EEEE",
                { locale: es }
              );
              const currentConfig = baseSchedule.find((item) => item.dayOfWeek === dayIndex);

              return (
                <div
                  key={dayIndex}
                  className="flex items-center justify-between p-3 rounded-sm bg-muted/30 border border-border"
                >
                  <span className="capitalize font-medium text-sm w-24 text-foreground">
                    {dayName}
                  </span>
                  <Select
                    value={configDraft[dayIndex] ?? dayUserId(currentConfig)}
                    onValueChange={(value) =>
                      setConfigDraft((prev) => ({ ...prev, [dayIndex]: value }))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger className="h-9 w-[min(200px,50vw)] border-input bg-background text-sm">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="z-[10060]">
                      <SelectItem
                        value="default"
                        className="text-muted-foreground font-light"
                      >
                        Sin asignar (Legacy)
                      </SelectItem>
                      {users
                        .filter((user) => user.id)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </form>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
          <Button
            variant="outline"
            type="button"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="bitcentral-config-form"
            disabled={isSaving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BitcentralOverrideDialog({
  selectedDate,
  setSelectedDate,
  users,
  isSaving,
  onOverride,
}: OverrideDialogProps) {
  return (
    <Dialog
      open={!!selectedDate}
      onOpenChange={(open) => {
        if (!open) setSelectedDate(null);
      }}
    >
      <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Edit2 className="w-5 h-5 text-blue-500" />
            Editar Horario:{" "}
            <span className="text-blue-500">
              {selectedDate && format(selectedDate, "EEEE d MMMM", { locale: es })}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-4 rounded-sm bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Selecciona quién cubrirá este turno (Modo Vacaciones/Cambio):
            </p>
            <Select onValueChange={onOverride} disabled={isSaving}>
              <SelectTrigger className="h-11 border-input bg-background text-foreground focus:ring-blue-500/50">
                <SelectValue placeholder="Seleccionar operador..." />
              </SelectTrigger>
              <SelectContent className="z-[10060] border-border bg-popover text-popover-foreground">
                <SelectItem
                  value="reset"
                  className="text-red-500 focus:text-red-600 font-bold focus:bg-red-500/10"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar Original
                  </div>
                </SelectItem>
                {users
                  .filter((user) => user.id)
                  .map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="focus:bg-accent focus:text-accent-foreground"
                    >
                      {user.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BitcentralEventsDialog({
  open,
  onOpenChange,
  events,
  newEventName,
  setNewEventName,
  newEventStart,
  setNewEventStart,
  newEventEnd,
  setNewEventEnd,
  isSaving,
  onCreateEvent,
  onDeleteEvent,
}: EventsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-500">
            <CalendarDays className="h-5 w-5" />
            Gestionar Eventos Especiales
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="p-4 rounded-sm bg-yellow-500/10 border border-yellow-500/20 space-y-4">
            <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              Nuevo Evento
            </h4>
            <div className="grid gap-3">
              <input
                placeholder="Nombre (ej. Maratónica)"
                className="w-full bg-background border border-input rounded-sm h-9 px-3 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground"
                value={newEventName}
                onChange={(event) => setNewEventName(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Inicio</label>
                  <input
                    type="date"
                    className="w-full bg-background border border-input rounded-sm h-9 px-3 text-sm text-foreground"
                    value={newEventStart ? format(newEventStart, "yyyy-MM-dd") : ""}
                    onChange={(event) =>
                      setNewEventStart(new Date(event.target.value + "T12:00:00"))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Fin</label>
                  <input
                    type="date"
                    className="w-full bg-background border border-input rounded-sm h-9 px-3 text-sm text-foreground"
                    value={newEventEnd ? format(newEventEnd, "yyyy-MM-dd") : ""}
                    onChange={(event) =>
                      setNewEventEnd(new Date(event.target.value + "T12:00:00"))
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                disabled={isSaving}
                className="h-9 w-full bg-yellow-500 font-bold text-black hover:bg-yellow-600"
                onClick={onCreateEvent}
              >
                {isSaving ? "Guardando…" : "Crear evento"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Eventos Activos
            </h4>
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-sm bg-muted/50 border border-border"
                >
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {event.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.startDate), "d MMM")} -{" "}
                      {format(new Date(event.endDate), "d MMM")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    onClick={() => onDeleteEvent(event.id)}
                  >
                    <div className="w-4 h-4">×</div>
                  </Button>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  No hay eventos programados.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
