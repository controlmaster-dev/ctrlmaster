"use client";

import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, User, Trash2, Plane, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shift, Operator, WeekDate, DayColumn, EditingState, WeeklyCalendarProps } from "@/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import {
  COSTA_RICA_TZ,
  getCostaRicaDateString,
  getCurrentDayIndex,
  getCurrentHourDecimal,
  getNextShiftSlot,
  getShiftCardWeekStatus,
  type ShiftCardWeekStatus,
} from "@/lib/operadorSchedule";
import { useScheduleClock } from "@/hooks/useScheduleClock";
import { cn } from "@/lib/utils";

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function formatShiftTime(hour: number): string {
  const endHour = hour === 0 ? 24 : hour;
  const ampm = endHour >= 12 ? 'pm' : 'am';
  const h = endHour % 12 || 12;
  return `${h}${ampm}`;
}

function formatShiftRange(start: number, end: number): string {
  const endHour = end === 0 ? 24 : end;
  return `${formatShiftTime(start)} – ${formatShiftTime(endHour)}`;
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name[0] || 'U').toUpperCase();
}

function shiftCardClasses(status: ShiftCardWeekStatus) {
  return {
    box:
      status === "active"
        ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
        : status === "upcoming"
          ? "border-violet-500/50 ring-1 ring-violet-500/20"
          : "border-border/80",
    name:
      status === "active"
        ? "text-emerald-800 dark:text-emerald-300"
        : status === "upcoming"
          ? "text-violet-800 dark:text-violet-300"
          : "text-foreground",
    time:
      status === "active"
        ? "font-semibold text-emerald-700 dark:text-emerald-400"
        : status === "upcoming"
          ? "font-semibold text-violet-700 dark:text-violet-400"
          : "font-medium text-foreground/90",
  };
}

export function WeeklyCalendar({
  operators,
  onUpdateSchedule,
  currentWeekStart,
  onWeekChange,
  isLoading = false,
  onEditUser
}: WeeklyCalendarProps) {
  const isEditingEnabled = !!onUpdateSchedule;
  const scheduleTick = useScheduleClock();
  const todayIdx = getCurrentDayIndex();
  const currentHour = getCurrentHourDecimal();

  const weekDates = useMemo<WeekDate[]>(() => {
    if (!currentWeekStart) return [];
    const start = new Date(currentWeekStart.includes('T') ? currentWeekStart : currentWeekStart + 'T12:00:00');
    if (isNaN(start.getTime())) return [];

    return DAYS.map((d, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        name: d,
        dateStr: formatInTimeZone(date, COSTA_RICA_TZ, "d/MM"),
        fullDate: formatInTimeZone(date, COSTA_RICA_TZ, "yyyy-MM-dd"),
      };
    });
  }, [currentWeekStart]);

  useEffect(() => {
    if (!onWeekChange || !currentWeekStart) return;
    const start = new Date(currentWeekStart + 'T12:00:00');
    if (isNaN(start.getTime())) return;
    if (start.getDay() !== 0) {
      const diff = start.getDay();
      start.setDate(start.getDate() - diff);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      onWeekChange(`${y}-${m}-${d}`);
    }
  }, [currentWeekStart, onWeekChange]);

  const isCurrentRealWeek = useMemo(() => {
    void scheduleTick;
    const todayCr = getCostaRicaDateString();
    return weekDates.some((wd) => wd.fullDate === todayCr);
  }, [weekDates, scheduleTick]);

  const nextShiftSlot = useMemo(() => {
    void scheduleTick;
    if (!isCurrentRealWeek) return null;
    return getNextShiftSlot(operators, todayIdx, currentHour);
  }, [operators, todayIdx, currentHour, isCurrentRealWeek, scheduleTick]);

  const dayColumns = useMemo<DayColumn[]>(() => {
    const columns: DayColumn[] = weekDates.map((d, i) => ({
      dateLabel: `${d.name} ${d.dateStr}`,
      dayIndex: i,
      shifts: []
    }));

    operators.forEach((op) => {
      if (!op.shifts) return;
      op.shifts.forEach((shift, shiftIndex) => {
        shift.days.forEach((dayIndex) => {
          if (columns[dayIndex]) {
            columns[dayIndex].shifts.push({ op, shift, shiftIndex });
          }
        });
      });
    });

    columns.forEach((col) => {
      col.shifts.sort((a, b) => a.shift.start - b.shift.start);
    });

    return columns;
  }, [operators, weekDates]);

  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [confirmingVacation, setConfirmingVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  const handleEditClick = (op: Operator, dayIndex: number) => {
    if (!isEditingEnabled) return;

    if (onEditUser) {
      onEditUser(op);
      return;
    }

    const userShiftsForDay = op.shifts?.filter((s) => s.days.includes(dayIndex)) || [];
    const shifts = userShiftsForDay.map((s) => ({
      ...s,
      targetOpId: op.id,
      tempId: Math.random().toString(36).substring(2, 11)
    }));
    setEditingState({
      originalOpId: op.id,
      dayIndex,
      shifts
    });
  };

  const handleVacationMode = async () => {
    if (!onUpdateSchedule || !editingState || !vacationStart || !vacationEnd) return;

    const start = new Date(vacationStart + 'T12:00:00');
    const end = new Date(vacationEnd + 'T12:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const datesByWeek: Record<string, number[]> = {};
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dateObj = new Date(dateStr + 'T12:00:00');
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day;
      const sunday = new Date(dateObj);
      sunday.setDate(diff);
      const y = sunday.getFullYear();
      const m = String(sunday.getMonth() + 1).padStart(2, '0');
      const d = String(sunday.getDate()).padStart(2, '0');
      const weekKey = `${y}-${m}-${d}`;

      if (!datesByWeek[weekKey]) datesByWeek[weekKey] = [];
      datesByWeek[weekKey].push(day);
      current.setDate(current.getDate() + 1);
    }

    const weekKeys = Object.keys(datesByWeek);
    for (const weekKey of weekKeys) {
      const daysToClear = datesByWeek[weekKey];

      if (weekKey === currentWeekStart) {
        const op = operators.find((o) => o.id === editingState.originalOpId);
        if (op && op.shifts) {
          const newShifts: Shift[] = [];
          op.shifts.forEach((s) => {
            const remainingDays = s.days.filter((d) => !daysToClear.includes(d));
            if (remainingDays.length > 0) newShifts.push({ ...s, days: remainingDays });
          });
          await onUpdateSchedule(editingState.originalOpId, newShifts, weekKey);
        }
      } else {
        try {
          const res = await fetch(`/api/users/public?weekStart=${weekKey}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            const data: Operator[] = await res.json();
            const op = data.find((u) => u.id === editingState.originalOpId);

            if (op && op.shifts) {
              const newShifts: Shift[] = [];
              op.shifts.forEach((s) => {
                const remainingDays = s.days.filter((d) => !daysToClear.includes(d));
                if (remainingDays.length > 0) newShifts.push({ ...s, days: remainingDays });
              });
              await onUpdateSchedule(editingState.originalOpId, newShifts, weekKey);
            } else {
              await onUpdateSchedule(editingState.originalOpId, [], weekKey);
            }
          }
        } catch (e) {
          console.error(`Error processing future week ${weekKey}`, e);
        }
      }
    }

    window.location.reload();
  };

  const saveChanges = () => {
    if (!editingState || !onUpdateSchedule) return;
    const { originalOpId, dayIndex, shifts } = editingState;

    const shiftsByOp: Record<string, EditingState["shifts"]> = {};
    shiftsByOp[originalOpId] = [];

    shifts.forEach((s) => {
      if (!shiftsByOp[s.targetOpId]) shiftsByOp[s.targetOpId] = [];
      shiftsByOp[s.targetOpId].push(s);
    });

    const opsToUpdate = new Set([...Object.keys(shiftsByOp), originalOpId]);

    opsToUpdate.forEach((opId) => {
      const op = operators.find((o) => o.id === opId);
      if (!op) return;
      const daysToClear = new Set<number>();

      if (opId === originalOpId) {
        daysToClear.add(dayIndex);
      }

      const myNewShifts = shiftsByOp[opId] || [];
      myNewShifts.forEach((s) => s.days.forEach((d: number) => daysToClear.add(d)));

      const cleanOriginalShifts: Shift[] = [];
      op.shifts?.forEach((s) => {
        const remainingDays = s.days.filter((d) => !daysToClear.has(d));
        if (remainingDays.length > 0) {
          cleanOriginalShifts.push({ ...s, days: remainingDays });
        }
      });

      const finalShifts = [...cleanOriginalShifts];
      myNewShifts.forEach((s) => {
        if (s.days.length > 0) {
          finalShifts.push({
            days: s.days,
            start: s.start,
            end: s.end
          });
        }
      });

      onUpdateSchedule(opId, finalShifts, currentWeekStart);
    });

    setEditingState(null);
  };

  const updateEditingShift = (tempId: string, field: string, value: string | number | number[]) => {
    if (!editingState) return;
    setEditingState({
      ...editingState,
      shifts: editingState.shifts.map((s) => s.tempId === tempId ? { ...s, [field]: value } : s)
    });
  };

  const removeShiftFromEdit = (tempId: string) => {
    if (!editingState) return;
    setEditingState({
      ...editingState,
      shifts: editingState.shifts.filter((s) => s.tempId !== tempId)
    });
  };

  const addNewShiftToEdit = () => {
    if (!editingState) return;
    setEditingState({
      ...editingState,
      shifts: [...editingState.shifts, {
        days: [editingState.dayIndex],
        start: 9,
        end: 17,
        targetOpId: editingState.originalOpId,
        tempId: Math.random().toString(36).substring(2, 11)
      }]
    });
  };

  const adjustWeek = (direction: 'prev' | 'next') => {
    if (!onWeekChange || !currentWeekStart) return;
    const date = new Date(currentWeekStart.includes('T') ? currentWeekStart : currentWeekStart + 'T12:00:00');
    if (isNaN(date.getTime())) return;

    date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    const day = date.getDay();
    if (day !== 0) {
      date.setDate(date.getDate() - day);
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onWeekChange(`${y}-${m}-${d}`);
  };

  return (
    <div className="operadores-ui relative flex h-full w-full flex-col overflow-hidden border border-border bg-card md:rounded-lg">
      <div className="flex items-center justify-between border-b border-border bg-muted/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="border border-border/60 bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground rounded-md">
            {currentWeekStart}
          </span>
          {isCurrentRealWeek && (
            <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              Semana actual
            </span>
          )}
        </div>

        {onWeekChange && (
          <div className="flex items-center border border-border/60 bg-background p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustWeek('prev')}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="border-x border-border/60 px-2.5 text-[10px] font-medium text-muted-foreground">
              Semana
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustWeek('next')}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 w-full bg-background/50 z-10 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin border-2 border-foreground/20 border-t-foreground" />
              <span className="text-xs text-muted-foreground">Cargando…</span>
            </div>
          </div>
        )}

        <div className="hidden h-full min-w-[1100px] md:grid md:grid-cols-7 md:divide-x md:divide-border">
          {WEEK_DISPLAY_ORDER.map((dayIdx) => {
            const col = dayColumns[dayIdx];
            if (!col) return null;
            const isToday = isCurrentRealWeek && dayIdx === todayIdx;
            const dayName = col.dateLabel.split(' ')[0];
            const dayDate = col.dateLabel.split(' ')[1];

            return (
              <div
                key={col.dayIndex}
                className={cn(
                  "group relative flex flex-col transition-colors",
                  isToday ? "bg-emerald-500/[0.03]" : "hover:bg-muted/5"
                )}
              >
                <div
                  className={cn(
                    "sticky top-0 z-10 border-b px-1 py-2.5 text-center",
                    isToday
                      ? "border-emerald-500/30 bg-background"
                      : "border-border bg-background"
                  )}
                >
                  <span
                    className={cn(
                      "mb-0.5 block text-[10px] font-medium uppercase tracking-wide",
                      isToday ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {dayName.slice(0, 3)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums leading-none",
                      isToday ? "text-emerald-800 dark:text-emerald-300" : "text-foreground"
                    )}
                  >
                    {dayDate}
                  </span>
                </div>

                <div className="flex-1 space-y-2 p-2 pb-10">
                  {col.shifts.map((item, idx) => {
                    const cardStatus = getShiftCardWeekStatus(
                      item.shift,
                      col.dayIndex,
                      item.op.id,
                      todayIdx,
                      currentHour,
                      isCurrentRealWeek,
                      nextShiftSlot
                    );
                    const accent = shiftCardClasses(cardStatus);

                    return (
                      <div
                        key={`${item.op.id}-${idx}`}
                        onClick={() => handleEditClick(item.op, col.dayIndex)}
                        className={cn(
                          "group/card relative cursor-pointer rounded-md border bg-card/80 p-2.5 transition-colors hover:bg-muted/30",
                          accent.box
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="h-7 w-7 shrink-0 rounded-md border border-border/60">
                            <AvatarImage src={item.op.image} className="rounded-md" />
                            <AvatarFallback className="rounded-md bg-muted text-[9px] font-medium text-muted-foreground">
                              {getInitials(item.op.name || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-xs font-medium leading-snug",
                                accent.name
                              )}
                            >
                              {item.op.name}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 font-mono text-xs tabular-nums",
                                accent.time
                              )}
                            >
                              {formatShiftRange(item.shift.start, item.shift.end)}
                            </p>
                          </div>
                        </div>

                        {item.op.isTempSchedule && (
                          <div
                            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500/80"
                            title="Horario temporal"
                          />
                        )}
                      </div>
                    );
                  })}

                  {isEditingEnabled && (
                    <button
                      className="flex w-full items-center justify-center gap-1 border border-dashed border-border/50 py-1.5 text-xs text-muted-foreground/60 opacity-0 transition-all hover:border-border hover:bg-muted/20 hover:text-foreground rounded-lg group-hover:opacity-100"
                      onClick={() => {
                        if (operators.length > 0) handleEditClick(operators[0], col.dayIndex);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full flex-col divide-y divide-border pb-20 md:hidden">
          {WEEK_DISPLAY_ORDER.map((dayIdx) => {
            const col = dayColumns[dayIdx];
            if (!col) return null;
            const isToday = isCurrentRealWeek && dayIdx === todayIdx;

            return (
              <div
                key={col.dayIndex}
                className={cn("flex flex-col", isToday && "bg-emerald-500/[0.03]")}
              >
                <div
                  className={cn(
                    "sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2.5",
                    isToday ? "border-emerald-500/30 bg-background" : "border-border bg-background"
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium capitalize",
                        isToday ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                      )}
                    >
                      {col.dateLabel.split(" ")[0]}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {col.dateLabel.split(" ")[1]}
                    </span>
                  </div>
                  {isToday && (
                    <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      Hoy
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 p-3">
                  {col.shifts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/5 py-3 text-center text-xs text-muted-foreground">
                      Sin turnos
                    </div>
                  ) : (
                    col.shifts.map((item, idx) => {
                      const cardStatus = getShiftCardWeekStatus(
                        item.shift,
                        col.dayIndex,
                        item.op.id,
                        todayIdx,
                        currentHour,
                        isCurrentRealWeek,
                        nextShiftSlot
                      );
                      const accent = shiftCardClasses(cardStatus);

                      return (
                        <div
                          key={`${item.op.id}-${idx}`}
                          onClick={() => handleEditClick(item.op, col.dayIndex)}
                          className={cn(
                            "cursor-pointer rounded-lg border bg-card p-3 transition-colors hover:bg-muted/20",
                            cardStatus === "none" ? "border-border" : accent.box
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <Avatar className="h-8 w-8 shrink-0 rounded-md border border-border/60">
                                <AvatarImage src={item.op.image} className="rounded-md" />
                                <AvatarFallback className="rounded-md bg-muted text-[9px] font-medium text-muted-foreground">
                                  {getInitials(item.op.name || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <p
                                className={cn(
                                  "min-w-0 truncate text-sm font-medium",
                                  accent.name
                                )}
                              >
                                {item.op.name}
                              </p>
                            </div>
                            <p
                              className={cn(
                                "shrink-0 font-mono text-xs tabular-nums",
                                accent.time
                              )}
                            >
                              {formatShiftRange(item.shift.start, item.shift.end)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!editingState} onOpenChange={(o) => { if (!o) setEditingState(null); }}>
        <DialogContent className="operadores-ui mb-0 flex max-h-[85vh] max-w-lg flex-col overflow-hidden rounded-lg border-border bg-card p-0 text-foreground shadow-none ring-1 ring-border">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Editar Turno
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  {editingState && DAYS[editingState.dayIndex]} ({editingState && weekDates[editingState.dayIndex]?.dateStr})
                </DialogDescription>
              </div>

              {isEditingEnabled && editingState && (
                <Dialog open={confirmingVacation} onOpenChange={setConfirmingVacation}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 border-rose-500/20 rounded-lg h-8 text-xs font-semibold"
                    >
                      <Plane className="w-3.5 h-3.5 mr-1.5" />
                      Vacaciones
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-sm rounded-lg">
                    <DialogTitle className="sr-only">Confirmar Vacaciones</DialogTitle>
                    <DialogDescription className="sr-only">Seleccione el rango de fechas para las vacaciones.</DialogDescription>
                    <div className="flex flex-col items-center text-center gap-4 py-4">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold">Planificar Vacaciones</h3>
                      <p className="text-sm text-muted-foreground">
                        Seleccione el rango de fechas.
                        <br />
                        <span className="text-xs opacity-70">Los turnos en este periodo serán eliminados.</span>
                      </p>

                      <div className="grid grid-cols-2 gap-4 w-full mt-2 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Desde</label>
                          <Input
                            type="date"
                            value={vacationStart}
                            onChange={(e) => setVacationStart(e.target.value)}
                            className="bg-muted/10 border-border text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Hasta</label>
                          <Input
                            type="date"
                            value={vacationEnd}
                            onChange={(e) => setVacationEnd(e.target.value)}
                            className="bg-muted/10 border-border text-xs rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 w-full mt-4">
                        <Button variant="ghost" onClick={() => setConfirmingVacation(false)} className="flex-1 rounded-lg">
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleVacationMode}
                          disabled={!vacationStart || !vacationEnd}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-lg"
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {editingState?.shifts.length === 0 && (
                <div className="border-2 border-dashed border-border/30 bg-muted/10 py-8 text-center text-sm text-muted-foreground rounded-lg">
                  No hay turnos asignados.
                </div>
              )}

              {editingState?.shifts.map((shift) => (
                <div key={shift.tempId} className="group relative space-y-4 border border-border bg-muted/10 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground tracking-wide uppercase font-semibold">Días aplicables</div>
                    <div className="flex gap-1 flex-wrap">
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, index) => {
                        const isSelected = shift.days.includes(index);
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              const newDays = isSelected
                                ? shift.days.filter((d) => d !== index)
                                : [...shift.days, index];
                              updateEditingShift(shift.tempId, 'days', newDays);
                            }}
                            title={DAYS[index]}
                            className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-colors ${isSelected ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                          >
                            {dayLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[10px] text-muted-foreground tracking-wide uppercase font-semibold">Horario</div>
                      <div className="flex items-center gap-2 w-full">
                        <Select value={String(shift.start)} onValueChange={(v) => updateEditingShift(shift.tempId, 'start', Number(v))}>
                          <SelectTrigger className="h-10 text-sm bg-card border-border rounded-lg flex-1 font-mono text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-lg">
                            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                              <SelectItem key={h} value={String(h)}>{formatShiftTime(h)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">-</span>
                        <Select value={String(shift.end)} onValueChange={(v) => updateEditingShift(shift.tempId, 'end', Number(v))}>
                          <SelectTrigger className="h-10 text-sm bg-card border-border rounded-lg flex-1 font-mono text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-lg">
                            {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                              <SelectItem key={h} value={String(h)}>{formatShiftTime(h)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg -mt-1"
                      onClick={() => removeShiftFromEdit(shift.tempId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground tracking-wide uppercase font-semibold">Asignado a</div>
                    <Select value={shift.targetOpId} onValueChange={(v) => updateEditingShift(shift.tempId, 'targetOpId', v)}>
                      <SelectTrigger className={`h-10 text-sm border-border rounded-lg ${editingState && shift.targetOpId !== editingState.originalOpId ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium' : 'bg-card text-foreground'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-lg">
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingState && shift.targetOpId !== editingState.originalOpId && (
                    <div className="bg-amber-500/5 text-amber-600 dark:text-amber-400 p-2.5 rounded-lg text-xs flex items-center gap-2 border border-amber-500/20">
                      <User className="w-3 h-3" />
                      Se moverá a{' '}
                      <span className="font-semibold">{operators.find((o) => o.id === shift.targetOpId)?.name}</span>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addNewShiftToEdit}
                className="w-full h-12 border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Turno
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border flex gap-3">
            <Button variant="ghost" onClick={() => setEditingState(null)} className="flex-1 rounded-lg hover:bg-muted/50">
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-lg bg-foreground font-semibold text-background hover:bg-foreground/90"
              onClick={saveChanges}
            >
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
