"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Bell,
  Settings,
} from "lucide-react";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { getBitcentralUser } from "@/lib/schedule";
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
}

export function BitcentralWidget({
  users,
  isReadOnly = false,
}: BitcentralWidgetProps) {
  const [today, setToday] = useState(new Date());
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [overrides, setOverrides] = useState<
    Array<{ date: string; user: { name: string } }>
  >([]);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      name: string;
      isActive: boolean;
      startDate: string;
      endDate: string;
    }>
  >([]);
  const [baseSchedule, setBaseSchedule] = useState<
    Array<{ dayOfWeek: number; user?: { name: string; id: string }; userId: string }>
  >([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isManageEventsOpen, setIsManageEventsOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [newEventName, setNewEventName] = useState("");
  const [newEventStart, setNewEventStart] = useState(new Date());
  const [newEventEnd, setNewEventEnd] = useState(new Date());

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    if (!weekStart || isNaN(weekStart.getTime())) return;
    const end = addDays(weekStart, 8);

    try {
      const [overridesRes, eventsRes, configRes] = await Promise.all([
        fetch(
          `/api/schedule?start=${weekStart.toISOString()}&end=${end.toISOString()}`
        ),
        fetch("/api/special-events"),
        fetch("/api/schedule/config"),
      ]);

      if (overridesRes.ok) setOverrides(await overridesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (configRes.ok) setBaseSchedule(await configRes.json());
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const baseScheduleMap = baseSchedule.reduce((acc, curr) => {
    if (curr.user) {
      acc[curr.dayOfWeek.toString()] = curr.user.name;
    }
    return acc;
  }, {} as Record<string, string>);

  const overrideMap = overrides.reduce((acc, curr) => {
    acc[new Date(curr.date).toDateString()] = curr.user.name;
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

    const dateKey = date.toDateString();
    if (overrideMap[dateKey]) {
      return { name: overrideMap[dateKey], isOverride: true, isRotation: false };
    }

    return getBitcentralUser(date, {}, baseScheduleMap);
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      const now = new Date();

      setToday((prev) => {
        if (!isSameDay(prev, now)) return now;
        return prev;
      });

      if (now.getMinutes() % 5 === 0 && now.getSeconds() < 10) {
        fetchData();
      }
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    if (isLoading || isReadOnly) return;

    const checkReminder = () => {
      const now = new Date();
      let targetDate = new Date(now);

      if (now.getHours() >= 2) {
        targetDate = addDays(now, 1);
      }

      const info = getDisplayInfo(targetDate);

      if ("isEvent" in info && info.isEvent) {
        toast.dismiss("shift-reminder");
        return;
      }

      const dateLabel = format(targetDate, "EEEE", { locale: es });
      const formattedDateLabel =
        dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

      toast("Recordatorio de Pauta", {
        description: (
          <span>
            <span className="text-foreground font-semibold">{info.name}</span>
            , toca preparar la playlist del{" "}
            <span className="text-yellow-600 dark:text-yellow-500 font-bold">
              {formattedDateLabel}
            </span>
            .
          </span>
        ),
        icon: <Bell className="w-5 h-5 text-yellow-500" />,
        id: "shift-reminder",
        duration: Infinity,
        position: "bottom-center",
        className: "mb-20 md:mb-0",
      });
    };

    if (overrides !== undefined && events !== undefined) {
      checkReminder();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, events, overrides, baseSchedule, isLoading]);

  const handleOverride = async (userId: string) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return;
    const res = await fetch("/api/schedule", {
      method: "POST",
      body: JSON.stringify({ date: selectedDate.toISOString(), userId }),
    });
    if (res.ok) {
      fetchData();
      setSelectedDate(null);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName || !newEventStart || !newEventEnd) return;

    const res = await fetch("/api/special-events", {
      method: "POST",
      body: JSON.stringify({
        name: newEventName,
        startDate: newEventStart.toISOString(),
        endDate: newEventEnd.toISOString(),
      }),
    });

    if (res.ok) {
      fetchData();
      setNewEventName("");
      setIsManageEventsOpen(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await fetch(`/api/special-events?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleSaveConfig = async (newSchedule: any[]) => {
    const res = await fetch("/api/schedule/config", {
      method: "POST",
      body: JSON.stringify({ schedule: newSchedule }),
    });
    if (res.ok) {
      toast.success("Horario base actualizado");
      fetchData();
      setIsConfigOpen(false);
    } else {
      toast.error("Error al actualizar horario");
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
    <Card className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/50 px-4 py-3">
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
              onClick={() => setIsConfigOpen(true)}
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
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex flex-col gap-1">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-2 rounded-lg px-2 py-2.5"
                >
                  <div className="h-9 w-9 shrink-0 rounded-md bg-muted" />
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
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
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
                      className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md ${
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
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
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
      </CardContent>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5 text-blue-500" />
              Configuración de Horario Base
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <p className="text-sm text-muted-foreground">
              Define el operador predeterminado para cada día de la semana. Los
              cambios aplicarán a todas las semanas futuras excepto donde haya
              modificaciones manuales.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updates = [];

                for (let i = 0; i < 7; i++) {
                  const userId = formData.get(`day-${i}`) as string;
                  if (userId && userId !== "default") {
                    updates.push({ dayOfWeek: i, userId });
                  }
                }
                handleSaveConfig(updates);
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <span className="capitalize font-medium text-sm w-24 text-foreground">
                      {dayName}
                    </span>
                    <Select
                      name={`day-${dayIndex}`}
                      defaultValue={currentConfig?.userId || "default"}
                    >
                      <SelectTrigger className="w-[200px] h-9 text-sm bg-background border-input">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="default"
                          className="text-muted-foreground font-light"
                        >
                          Sin asignar (Legacy)
                        </SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedDate}
        onOpenChange={(o) => {
          if (!o) setSelectedDate(null);
        }}
      >
        <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl">
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
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona quién cubrirá este turno (Modo Vacaciones/Cambio):
              </p>
              <Select onValueChange={handleOverride}>
                <SelectTrigger className="bg-background border-input focus:ring-blue-500/50 text-foreground h-11">
                  <SelectValue placeholder="Seleccionar operador..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem
                    value="reset"
                    className="text-red-500 focus:text-red-600 font-bold focus:bg-red-500/10"
                  >
                    <div className="flex items-center gap-2">
                      <span>🔄</span> Restaurar Original
                    </div>
                  </SelectItem>
                  {users.map((u) => (
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
        <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              ★ Gestionar Eventos Especiales
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-4">
              <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Nuevo Evento
              </h4>
              <div className="grid gap-3">
                <input
                  placeholder="Nombre (ej. Maratónica)"
                  className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Inicio</label>
                    <input
                      type="date"
                      className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground"
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
                      className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground"
                      value={newEventEnd ? format(newEventEnd, "yyyy-MM-dd") : ""}
                      onChange={(e) =>
                        setNewEventEnd(new Date(e.target.value + "T12:00:00"))
                      }
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-9"
                  onClick={handleCreateEvent}
                >
                  Crear Evento
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
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
    </Card>
  );
}