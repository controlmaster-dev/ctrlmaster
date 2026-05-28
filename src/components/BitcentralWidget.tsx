"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Settings,
} from "lucide-react";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { getBitcentralUser, scheduleDateKey } from "@/lib/schedule";
import {
  getBitcentralCache,
  invalidateBitcentralCache,
  prefetchBitcentralWeek,
  type BitcentralBaseDay,
  type BitcentralEvent,
  type BitcentralOverride,
} from "@/lib/bitcentralCache";
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
import { toast } from "sonner";

interface BitcentralWidgetProps {
  users: Array<{ id: string; name: string }>;
  isReadOnly?: boolean;
  className?: string;
}

export function BitcentralWidget({
  users,
  isReadOnly = false,
  className,
}: BitcentralWidgetProps) {
  const [today, setToday] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const initialCache =
    typeof window !== "undefined" ? getBitcentralCache(weekStart) : null;
  const [overrides, setOverrides] = useState<BitcentralOverride[]>(
    initialCache?.overrides ?? []
  );
  const [events, setEvents] = useState<BitcentralEvent[]>(
    initialCache?.events ?? []
  );
  const [baseSchedule, setBaseSchedule] = useState<BitcentralBaseDay[]>(
    initialCache?.baseSchedule ?? []
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isManageEventsOpen, setIsManageEventsOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<number, string>>({});

  const [newEventName, setNewEventName] = useState("");
  const [newEventStart, setNewEventStart] = useState(new Date());
  const [newEventEnd, setNewEventEnd] = useState(new Date());

  const [isLoading, setIsLoading] = useState(!initialCache);
  const [isSaving, setIsSaving] = useState(false);
  const hasShownData = React.useRef(!!initialCache);

  const applyBundle = React.useCallback(
    (bundle: {
      overrides: BitcentralOverride[];
      events: BitcentralEvent[];
      baseSchedule: BitcentralBaseDay[];
    }) => {
      setOverrides(bundle.overrides);
      setEvents(bundle.events);
      setBaseSchedule(bundle.baseSchedule);
      hasShownData.current = true;
    },
    []
  );

  const fetchData = React.useCallback(
    async (silent = false, force = false) => {
      if (!weekStart || isNaN(weekStart.getTime())) return;

      if (!force) {
        const cached = getBitcentralCache(weekStart);
        if (cached) {
          applyBundle(cached);
          setIsLoading(false);
        } else if (!silent && !hasShownData.current) {
          setIsLoading(true);
        }
      } else if (!silent && !hasShownData.current) {
        setIsLoading(true);
      }

      const bundle = await prefetchBitcentralWeek(weekStart, { force });
      if (bundle) applyBundle(bundle);
      setIsLoading(false);
    },
    [weekStart, applyBundle]
  );

  const baseScheduleMap = baseSchedule.reduce((acc, curr) => {
    if (curr.user) {
      acc[curr.dayOfWeek.toString()] = curr.user.name;
    }
    return acc;
  }, {} as Record<string, string>);

  const overrideMap = overrides.reduce((acc, curr) => {
    const key = scheduleDateKey(curr.date);
    if (key && curr.user?.name) {
      acc[key] = curr.user.name;
    }
    return acc;
  }, {} as Record<string, string>);

  const getDisplayInfo = (date: Date) => {
    const validEvents = Array.isArray(events) ? events : [];
    const event = validEvents.find((e) => {
      if (!e.isActive) return false;
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const check = new Date(date);
      check.setHours(12, 0, 0, 0);
      return check >= start && check <= end;
    });

    if (event) {
      return { name: event.name, isEvent: true, eventId: event.id };
    }

    const dateKey = scheduleDateKey(date);
    if (overrideMap[dateKey]) {
      return { name: overrideMap[dateKey], isOverride: true, isRotation: false };
    }

    return getBitcentralUser(date, {}, baseScheduleMap);
  };

  useEffect(() => {
    hasShownData.current = false;
    void fetchData(false);

    const interval = setInterval(() => {
      const now = new Date();

      setToday((prev) => {
        if (!isSameDay(prev, now)) return now;
        return prev;
      });

      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      if (now.getMinutes() % 5 === 0 && now.getSeconds() < 10) {
        void fetchData(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [weekStart, fetchData]);

  const handleOverride = async (userId: string) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          userId,
        }),
      });
      if (res.ok) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const operator = users.find((u) => u.id === userId);

        setOverrides((prev) => {
          const rest = prev.filter((o) => scheduleDateKey(o.date) !== dateStr);
          if (userId === "reset" || !operator) return rest;
          return [...rest, { date: dateStr, user: { name: operator.name } }];
        });

        toast.success(
          userId === "reset" ? "Turno restaurado al horario base" : "Turno actualizado"
        );
        invalidateBitcentralCache(weekStart);
        await fetchData(true, true);
        setSelectedDate(null);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          typeof err.error === "string" ? err.error : "No se pudo guardar el cambio"
        );
      }
    } catch {
      toast.error("Error de conexión al guardar el turno");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName?.trim() || !newEventStart || !newEventEnd) {
      toast.error("Completa nombre y fechas del evento");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/special-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName.trim(),
          startDate: format(newEventStart, "yyyy-MM-dd"),
          endDate: format(newEventEnd, "yyyy-MM-dd"),
        }),
      });

      if (res.ok) {
        toast.success("Evento creado");
        invalidateBitcentralCache();
        await fetchData(true, true);
        setNewEventName("");
        setIsManageEventsOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          typeof err.error === "string" ? err.error : "No se pudo crear el evento"
        );
      }
    } catch {
      toast.error("Error de conexión al crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/special-events?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Evento eliminado");
        invalidateBitcentralCache();
        await fetchData(true, true);
      } else {
        toast.error("No se pudo eliminar el evento");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const dayUserId = (entry?: BitcentralBaseDay) =>
    entry?.userId || entry?.user?.id || "default";

  const buildConfigDraft = () => {
    const draft: Record<number, string> = {};
    for (const dayIndex of [0, 1, 2, 3, 4, 5, 6]) {
      const current = baseSchedule.find((s) => s.dayOfWeek === dayIndex);
      draft[dayIndex] = dayUserId(current);
    }
    return draft;
  };

  const openConfigModal = () => {
    setConfigDraft(buildConfigDraft());
    setIsConfigOpen(true);
  };

  const handleConfigOpenChange = (open: boolean) => {
    if (open) setConfigDraft(buildConfigDraft());
    setIsConfigOpen(open);
  };

  const handleSaveConfig = async (
    newSchedule: Array<{ dayOfWeek: number; userId: string }>
  ) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/schedule/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: newSchedule }),
      });
      if (res.ok) {
        toast.success("Horario base actualizado");
        invalidateBitcentralCache();
        await fetchData(true, true);
        setIsConfigOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          typeof err.error === "string" ? err.error : "Error al actualizar horario"
        );
      }
    } catch {
      toast.error("Error de conexión al guardar el horario");
    } finally {
      setIsSaving(false);
    }
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const getInitials = (name: string) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const statusBadge = (info: {
    isOverride?: boolean;
    isRotation?: boolean;
  }) => {
    if (info.isOverride) {
      return (
        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Cambio manual
        </span>
      );
    }
    if (info.isRotation) {
      return (
        <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
          Rotativo
        </span>
      );
    }
    return (
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        Regular
      </span>
    );
  };

  const goToCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = isSameDay(
    weekStart,
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  return (
    <BentoCard variant="default" className={cn("overflow-hidden", className)}>
      <div className="flex flex-row items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CalIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground">Pauta Bitcentral</span>
            <p className="text-[11px] text-muted-foreground">Turnos de la semana</p>
          </div>
        </div>
        {!isReadOnly && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={openConfigModal}
              title="Horario base"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setIsManageEventsOpen(true)}
              title="Eventos especiales"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {!isCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-[11px]"
                onClick={goToCurrentWeek}
              >
                Hoy
              </Button>
            )}
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onMouseEnter={() => void prefetchBitcentralWeek(addDays(weekStart, -7))}
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[88px] select-none px-1 text-center text-[11px] font-medium text-foreground">
                {format(weekStart, "d MMM", { locale: es })} –{" "}
                {format(addDays(weekStart, 6), "d MMM", { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onMouseEnter={() => void prefetchBitcentralWeek(addDays(weekStart, 7))}
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="flex flex-col gap-1">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-2 rounded-sm px-2 py-2.5"
                >
                  <div className="h-9 w-9 shrink-0 rounded-sm bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-2.5 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))
            : days.map((date) => {
                const info = getDisplayInfo(date) as {
                  name: string;
                  isEvent?: boolean;
                  eventId?: string;
                  isOverride?: boolean;
                  isRotation?: boolean;
                };
                const isTodayStr = isSameDay(date, today);
                const toISO = (d: Date) =>
                  isNaN(d.getTime()) ? `invalid-${Math.random()}` : d.toISOString();

                if (info.isEvent) {
                  return (
                    <div
                      key={toISO(date)}
                      className="flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2 py-2"
                    >
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <span className="text-[9px] font-semibold uppercase leading-none">
                          {format(date, "EEE", { locale: es })}
                        </span>
                        <span className="text-sm font-semibold leading-none">
                          {format(date, "d")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-amber-700 dark:text-amber-300">
                          {info.name}
                        </p>
                        <span className="mt-0.5 inline-block rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          Evento especial
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={toISO(date)}
                    role={!isReadOnly ? "button" : undefined}
                    tabIndex={!isReadOnly ? 0 : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors ${
                      isTodayStr
                        ? "bg-blue-500/8 ring-1 ring-blue-500/25"
                        : "hover:bg-muted/40"
                    } ${!isReadOnly ? "cursor-pointer" : ""}`}
                    onClick={() => !isReadOnly && setSelectedDate(date)}
                    onKeyDown={(e) => {
                      if (!isReadOnly && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedDate(date);
                      }
                    }}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg ${
                        isTodayStr
                          ? "bg-blue-600 text-white"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {format(date, "EEE", { locale: es })}
                      </span>
                      <span className="text-sm font-semibold leading-none">
                        {format(date, "d")}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                          isTodayStr
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getInitials(info.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {info.name}
                        </p>
                        <div className="mt-0.5">{statusBadge(info)}</div>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <Edit2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      <Dialog open={isConfigOpen} onOpenChange={handleConfigOpenChange}>
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
              onSubmit={(e) => {
                e.preventDefault();
                const updates: Array<{ dayOfWeek: number; userId: string }> = [];
                for (let i = 0; i < 7; i++) {
                  const userId = configDraft[i] ?? "default";
                  const hadAssignment = baseSchedule.some((s) => s.dayOfWeek === i);
                  if (userId === "default") {
                    if (hadAssignment) {
                      updates.push({ dayOfWeek: i, userId: "REMOVE" });
                    }
                  } else {
                    updates.push({ dayOfWeek: i, userId });
                  }
                }
                void handleSaveConfig(updates);
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

                const currentConfig = baseSchedule.find(
                  (s) => s.dayOfWeek === dayIndex
                );

                return (
                  <div
                    key={dayIndex}
                    className="flex items-center justify-between p-3 rounded-sm bg-muted/30 border border-border"
                  >
                    <span className="capitalize font-medium text-sm w-24 text-foreground">
                      {dayName}
                    </span>
                    <Select
                      value={
                        configDraft[dayIndex] ?? dayUserId(currentConfig)
                      }
                      onValueChange={(val) =>
                        setConfigDraft((prev) => ({ ...prev, [dayIndex]: val }))
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
                          .filter((u) => u.id)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
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
              onClick={() => setIsConfigOpen(false)}
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

      <Dialog
        open={!!selectedDate}
        onOpenChange={(o) => {
          if (!o) setSelectedDate(null);
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
              <Select onValueChange={handleOverride} disabled={isSaving}>
                <SelectTrigger className="h-11 border-input bg-background text-foreground focus:ring-blue-500/50">
                  <SelectValue placeholder="Seleccionar operador..." />
                </SelectTrigger>
                <SelectContent className="z-[10060] border-border bg-popover text-popover-foreground">
                  <SelectItem
                    value="reset"
                    className="text-red-500 focus:text-red-600 font-bold focus:bg-red-500/10"
                  >
                    <div className="flex items-center gap-2">
                      <span>🔄</span> Restaurar Original
                    </div>
                  </SelectItem>
                  {users
                    .filter((u) => u.id)
                    .map((u) => (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        className="focus:bg-accent focus:text-accent-foreground"
                      >
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageEventsOpen} onOpenChange={setIsManageEventsOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              ★ Gestionar Eventos Especiales
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
                  onChange={(e) => setNewEventName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Inicio</label>
                    <input
                      type="date"
                      className="w-full bg-background border border-input rounded-sm h-9 px-3 text-sm text-foreground"
                      value={newEventStart ? format(newEventStart, "yyyy-MM-dd") : ""}
                      onChange={(e) =>
                        setNewEventStart(new Date(e.target.value + "T12:00:00"))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Fin</label>
                    <input
                      type="date"
                      className="w-full bg-background border border-input rounded-sm h-9 px-3 text-sm text-foreground"
                      value={newEventEnd ? format(newEventEnd, "yyyy-MM-dd") : ""}
                      onChange={(e) =>
                        setNewEventEnd(new Date(e.target.value + "T12:00:00"))
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={isSaving}
                  className="h-9 w-full bg-yellow-500 font-bold text-black hover:bg-yellow-600"
                  onClick={() => void handleCreateEvent()}
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
                      onClick={() => handleDeleteEvent(event.id)}
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
    </BentoCard>
  );
}