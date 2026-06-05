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
import { scheduleDateKey } from "@/lib/schedule";
import {
  getBitcentralCache,
  invalidateBitcentralCache,
  prefetchBitcentralWeek,
  type BitcentralBaseDay,
  type BitcentralEvent,
  type BitcentralOverride,
} from "@/lib/bitcentralCache";
import { toast } from "sonner";
import {
  BitcentralConfigDialog,
  BitcentralEventsDialog,
  BitcentralOverrideDialog,
} from "@/components/bitcentral/BitcentralDialogs";
import { BitcentralStatusBadge } from "@/components/bitcentral/BitcentralStatusBadge";
import {
  buildBaseScheduleMap,
  buildOverrideMap,
  dayUserId,
  getDisplayInfo,
  getInitials,
  type BitcentralDisplayInfo,
} from "@/components/bitcentral/bitcentralUtils";

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

  const baseScheduleMap = React.useMemo(
    () => buildBaseScheduleMap(baseSchedule),
    [baseSchedule]
  );

  const overrideMap = React.useMemo(
    () => buildOverrideMap(overrides),
    [overrides]
  );

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
                const info: BitcentralDisplayInfo = getDisplayInfo(
                  date,
                  Array.isArray(events) ? events : [],
                  overrideMap,
                  baseScheduleMap
                );
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
                        <div className="mt-0.5">
                          <BitcentralStatusBadge info={info} />
                        </div>
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

      <BitcentralConfigDialog
        open={isConfigOpen}
        onOpenChange={handleConfigOpenChange}
        configDraft={configDraft}
        setConfigDraft={setConfigDraft}
        baseSchedule={baseSchedule}
        users={users}
        isSaving={isSaving}
        onSave={(updates) => void handleSaveConfig(updates)}
      />

      <BitcentralOverrideDialog
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        users={users}
        isSaving={isSaving}
        onOverride={(userId) => void handleOverride(userId)}
      />

      <BitcentralEventsDialog
        open={isManageEventsOpen}
        onOpenChange={setIsManageEventsOpen}
        events={events}
        newEventName={newEventName}
        setNewEventName={setNewEventName}
        newEventStart={newEventStart}
        setNewEventStart={setNewEventStart}
        newEventEnd={newEventEnd}
        setNewEventEnd={setNewEventEnd}
        isSaving={isSaving}
        onCreateEvent={() => void handleCreateEvent()}
        onDeleteEvent={(id) => void handleDeleteEvent(id)}
      />

    </BentoCard>
  );
}
