"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, User, Trash2, Plane, CalendarDays, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shift, Operator, WeekDate, DayColumn, EditingState, WeeklyCalendarProps } from "@/lib/types";

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
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
  const isMobile = useIsMobile();

  const weekDates = useMemo<WeekDate[]>(() => {
    if (!currentWeekStart) return [];
    const start = new Date(currentWeekStart.includes('T') ? currentWeekStart : currentWeekStart + 'T12:00:00');
    if (isNaN(start.getTime())) return [];

    return DAYS.map((d, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayNum = date.getDate();
      const monthNum = date.getMonth() + 1;
      return {
        name: d,
        dateStr: `${dayNum}/${monthNum.toString().padStart(2, '0')}`,
        fullDate: date.toISOString().split('T')[0]
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
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    return weekDates.some((wd) => wd.fullDate === nowStr);
  }, [weekDates]);

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

  const formatTime = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:00 ${ampm}`;
  };

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
          const res = await fetch(`/api/users?weekStart=${weekKey}`, { cache: 'no-store' });
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

    const shiftsByOp: Record<string, any[]> = {};
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
    <div className="bg-card md:rounded-md border border-border overflow-hidden flex flex-col h-full w-full relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono font-medium opacity-70">
            {currentWeekStart}
          </Badge>
          {isCurrentRealWeek && (
            <Badge variant="default" className="bg-[#FF0C60] text-white border-none shadow-sm text-[10px] px-1.5 h-5">
              Actual
            </Badge>
          )}
        </div>

        {onWeekChange && (
          <div className="flex items-center gap-1 bg-card rounded-md border border-border p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustWeek('prev')}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">
              Navegar
            </span>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustWeek('next')}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 w-full bg-background/50 z-10 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#FF0C60] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#FF0C60] animate-pulse">Cargando...</span>
            </div>
          </div>
        )}

        <div className="hidden md:grid grid-cols-7 divide-x divide-border h-full min-w-[1200px]">
          {dayColumns.map((col, i) => {
            const isToday = isCurrentRealWeek && new Date().getDay() === i;
            return (
              <div
                key={col.dayIndex}
                className={`flex flex-col relative group transition-colors ${isToday ? 'bg-[#FF0C60]/[0.02]' : 'hover:bg-muted/10'}`}
              >
                <div className={`sticky top-0 z-10 py-3 text-center border-b backdrop-blur-md ${isToday ? 'bg-[#FF0C60]/10 border-[#FF0C60]/20 text-[#FF0C60]' : 'bg-background/80 border-border text-muted-foreground'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5">
                    {col.dateLabel.split(' ')[0]}
                  </span>
                  <span className="text-lg font-semibold leading-none">
                    {col.dateLabel.split(' ')[1]}
                  </span>
                </div>

                <div className="p-1 space-y-1 flex-1 pb-10">
                  {col.shifts.map((item, idx) => {
                    const isActiveNow = isToday &&
                      new Date().getHours() >= item.shift.start &&
                      new Date().getHours() < (item.shift.end === 0 ? 24 : item.shift.end);
                    return (
                      <motion.div
                        key={`${item.op.id}-${idx}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleEditClick(item.op, col.dayIndex)}
                        className={`relative overflow-hidden rounded-md border p-1.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#FF0C60]/40 group/card ${isActiveNow ? 'bg-card border-[#FF0C60] shadow-sm ring-1 ring-[#FF0C60]/20' : 'bg-card border-border shadow-none hover:bg-muted/30'}`}
                      >
                        {isActiveNow && (
                          <div className="absolute top-0 right-0 w-2 h-2 m-1.5 bg-[#FF0C60] rounded-full animate-pulse" />
                        )}

                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Avatar className="w-5 h-5 rounded-md border border-border">
                            <AvatarImage src={item.op.image} />
                            <AvatarFallback className="rounded-md bg-muted text-[8px] font-medium text-muted-foreground">
                              {item.op.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="text-[10px] font-medium text-foreground truncate leading-tight">
                              {item.op.name}
                            </div>
                            <div className="text-[8px] text-muted-foreground truncate mt-[1px] leading-none">
                              {item.op.role === 'BOSS' ? 'Admin' : 'Operador'}
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between text-[9px] font-mono px-1 py-0.5 rounded ${isActiveNow ? 'bg-[#FF0C60]/10 text-[#FF0C60] font-semibold' : 'bg-muted/50 text-muted-foreground'}`}>
                          <span>{formatTime(item.shift.start)}</span>
                          <span className="opacity-30">-</span>
                          <span>{formatTime(item.shift.end)}</span>
                        </div>

                        {item.op.isTempSchedule && (
                          <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-500 rounded-full" title="Horario temporal" />
                        )}
                      </motion.div>
                    );
                  })}

                  {isEditingEnabled && (
                    <button
                      className="w-full py-1.5 rounded border border-dashed border-border/50 text-xs text-muted-foreground/50 hover:text-[#FF0C60] hover:border-[#FF0C60]/30 hover:bg-[#FF0C60]/5 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1"
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

        <div className="md:hidden flex flex-col w-full pb-20 divide-y divide-border">
          {dayColumns.map((col, i) => {
            const isToday = isCurrentRealWeek && new Date().getDay() === i;
            return (
              <div key={col.dayIndex} className={`flex flex-col ${isToday ? 'bg-[#FF0C60]/[0.02]' : ''}`}>
                <div className={`sticky top-0 z-20 px-4 py-2 flex items-center justify-between backdrop-blur-xl border-b border-border/50 ${isToday ? 'bg-[#FF0C60]/5 border-[#FF0C60]/20' : 'bg-background/90'}`}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-semibold capitalize ${isToday ? 'text-[#FF0C60]' : 'text-foreground'}`}>
                      {col.dateLabel.split(' ')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {col.dateLabel.split(' ')[1]}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-medium text-[#FF0C60] bg-[#FF0C60]/10 px-2 py-0.5 rounded-full">
                      HOY
                    </span>
                  )}
                </div>

                <div className="p-3 grid grid-cols-1 gap-2">
                  {col.shifts.length === 0 ? (
                    <div className="text-xs text-muted-foreground/40 italic py-2 text-center">Sin turnos</div>
                  ) : (
                    col.shifts.map((item, idx) => (
                      <div
                        key={`${item.op.id}-${idx}`}
                        onClick={() => handleEditClick(item.op, col.dayIndex)}
                        className="bg-card border border-border rounded-lg p-3 flex items-center justify-between active:scale-[0.99] transition-transform shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar className="w-9 h-9 border border-border shrink-0">
                            <AvatarImage src={item.op.image} />
                            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-medium">
                              {item.op.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{item.op.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                              {item.op.role === 'BOSS' ? (
                                <span className="text-amber-500 flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Admin
                                </span>
                              ) : 'Operador'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <div className="text-xs font-mono text-foreground">{formatTime(item.shift.start)}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{formatTime(item.shift.end)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!editingState} onOpenChange={(o) => { if (!o) setEditingState(null); }}>
        <DialogContent className="bg-card backdrop-blur-2xl border-border text-foreground max-w-lg mb-0 rounded-md shadow-none ring-1 ring-border overflow-hidden p-0 max-h-[85vh] flex flex-col">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <DialogTitle className="font-semibold text-2xl tracking-tight text-foreground">
                  Editar Turno
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF0C60]" />
                  {editingState && DAYS[editingState.dayIndex]} ({editingState && weekDates[editingState.dayIndex]?.dateStr})
                </DialogDescription>
              </div>

              {isEditingEnabled && editingState && (
                <Dialog open={confirmingVacation} onOpenChange={setConfirmingVacation}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border-rose-200"
                    >
                      <Plane className="w-4 h-4 mr-2" />
                      Vacaciones
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-sm">
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
                            className="bg-muted/10 border-border text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Hasta</label>
                          <Input
                            type="date"
                            value={vacationEnd}
                            onChange={(e) => setVacationEnd(e.target.value)}
                            className="bg-muted/10 border-border text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 w-full mt-4">
                        <Button variant="ghost" onClick={() => setConfirmingVacation(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleVacationMode}
                          disabled={!vacationStart || !vacationEnd}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
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
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/30 rounded-2xl bg-muted/10">
                  No hay turnos asignados.
                </div>
              )}

              {editingState?.shifts.map((shift) => (
                <div key={shift.tempId} className="bg-muted/30 p-5 rounded-2xl border border-border space-y-5 relative group shadow-sm">
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Días aplicables</div>
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
                            className={`w-8 h-8 rounded-md text-xs font-medium transition-all border ${isSelected ? 'bg-[#FF0C60] text-white border-[#FF0C60] shadow-md shadow-[#FF0C60]/20' : 'bg-card text-muted-foreground border-border hover:bg-muted hover:border-border'}`}
                          >
                            {dayLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Horario</div>
                      <div className="flex items-center gap-2 w-full">
                        <Select value={String(shift.start)} onValueChange={(v) => updateEditingShift(shift.tempId, 'start', Number(v))}>
                          <SelectTrigger className="h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                              <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">-</span>
                        <Select value={String(shift.end)} onValueChange={(v) => updateEditingShift(shift.tempId, 'end', Number(v))}>
                          <SelectTrigger className="h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                              <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 -mt-1"
                      onClick={() => removeShiftFromEdit(shift.tempId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Asignado a</div>
                    <Select value={shift.targetOpId} onValueChange={(v) => updateEditingShift(shift.tempId, 'targetOpId', v)}>
                      <SelectTrigger className={`h-10 text-sm border-border rounded-md ${editingState && shift.targetOpId !== editingState.originalOpId ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium' : 'bg-card text-foreground'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingState && shift.targetOpId !== editingState.originalOpId && (
                    <div className="bg-amber-500/10 text-amber-500/90 p-2.5 rounded-md text-xs flex items-center gap-2 border border-amber-500/20">
                      <User className="w-3 h-3" />
                      Se moverá a{' '}
                      <span className="font-medium">{operators.find((o) => o.id === shift.targetOpId)?.name}</span>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addNewShiftToEdit}
                className="w-full h-12 border-dashed border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-border transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Turno
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border flex gap-3">
            <Button variant="ghost" onClick={() => setEditingState(null)} className="flex-1 rounded-md hover:bg-muted/50">
              Cancelar
            </Button>
            <Button
              className="bg-[#FF0C60] hover:bg-[#d90a50] text-white flex-1 rounded-md shadow-lg shadow-rose-900/20 transition-all font-medium tracking-wide"
              onClick={saveChanges}
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
