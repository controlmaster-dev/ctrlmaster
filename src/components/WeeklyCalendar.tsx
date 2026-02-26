"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, User, Trash2, Plane, CalendarDays, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function WeeklyCalendar({ operators, onUpdateSchedule, currentWeekStart, onWeekChange, isLoading = false, onEditUser }) {
  const isEditingEnabled = !!onUpdateSchedule;


  const weekDates = useMemo(() => {
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
      console.log("Auto-correcting Week Start from", currentWeekStart);
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


  const dayColumns = useMemo(() => {
    const columns = weekDates.map((d, i) => ({
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

  const formatTime = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:00 ${ampm}`;
  };







  const [editingState, setEditingState] = useState(



    null);


  const [confirmingVacation, setConfirmingVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  const handleEditClick = (op, dayIndex) => {
    if (!isEditingEnabled) return;


    if (onEditUser) {
      onEditUser(op);
      return;
    }

    const userShiftsForDay = op.shifts?.filter((s) => s.days.includes(dayIndex)) || [];
    const shifts = userShiftsForDay.map((s) => ({
      ...s,
      targetOpId: op.id,
      tempId: Math.random().toString(36).substr(2, 9)
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


    const datesByWeek = {};

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
      console.log(`Processing Week ${weekKey}. Days to Clear: ${daysToClear}`);


      if (weekKey === currentWeekStart) {
        const op = operators.find((o) => o.id === editingState.originalOpId);
        if (op && op.shifts) {
          const newShifts = [];
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
            const data = await res.json();
            const op = data.find((u: { id: string; shifts: Array<any> }) => u.id === editingState.originalOpId);

            if (op && op.shifts) {
              const newShifts = [];
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


    const shiftsByOp = {};


    shiftsByOp[originalOpId] = [];

    shifts.forEach((s) => {
      if (!shiftsByOp[s.targetOpId]) shiftsByOp[s.targetOpId] = [];
      shiftsByOp[s.targetOpId].push(s);
    });


    const opsToUpdate = new Set([...Object.keys(shiftsByOp), originalOpId]);

    opsToUpdate.forEach((opId) => {
      const op = operators.find((o) => o.id === opId);
      if (!op) return;
      const daysToClear = new Set();

      if (opId === originalOpId) {
        daysToClear.add(dayIndex);
      }

      const myNewShifts = shiftsByOp[opId] || [];
      myNewShifts.forEach((s) => s.days.forEach((d) => daysToClear.add(d)));

      const cleanOriginalShifts = [];

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

  const removeShiftFromEdit = (tempId) => {
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
        tempId: Math.random().toString(36).substr(2, 9)
      }]
    });
  };

  const adjustWeek = (direction) => {
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
    _jsxs("div", {
      className: "bg-card md:rounded-md border border-border overflow-hidden flex flex-col h-full w-full relative", children: [

        _jsxs("div", {
          className: "flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20", children: [
            _jsxs("div", {
              className: "flex items-center gap-2", children: [
                _jsx(Badge, {
                  variant: "outline", className: "text-xs font-mono font-medium opacity-70", children:
                    currentWeekStart
                }
                ),
                isCurrentRealWeek && _jsx(Badge, { className: "bg-[#FF0C60] text-white border-none shadow-sm text-[10px] px-1.5 h-5", children: "Actual" })]
            }
            ),

            onWeekChange &&
            _jsxs("div", {
              className: "flex items-center gap-1 bg-card rounded-md border border-border p-0.5 shadow-sm", children: [
                _jsx(Button, {
                  variant: "ghost", size: "icon", onClick: () => adjustWeek('prev'), className: "h-7 w-7 text-muted-foreground hover:text-foreground", children:
                    _jsx(ChevronLeft, { className: "w-4 h-4" })
                }
                ),
                _jsx("div", { className: "h-4 w-[1px] bg-border mx-1" }),
                _jsx("span", { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2", children: "Navegar" }),
                _jsx("div", { className: "h-4 w-[1px] bg-border mx-1" }),
                _jsx(Button, {
                  variant: "ghost", size: "icon", onClick: () => adjustWeek('next'), className: "h-7 w-7 text-muted-foreground hover:text-foreground", children:
                    _jsx(ChevronRight, { className: "w-4 h-4" })
                }
                )]
            }
            )]
        }

        ),

        _jsxs(ScrollArea, {
          className: "flex-1 w-full bg-background/50 z-10 relative", children: [
            isLoading &&
            _jsx("div", {
              className: "absolute inset-0 z-50 bg-background/60 backdrop-blur-[1px] flex items-center justify-center", children:
                _jsxs("div", {
                  className: "flex flex-col items-center gap-2", children: [
                    _jsx("div", { className: "w-8 h-8 border-2 border-[#FF0C60] border-t-transparent rounded-full animate-spin" }),
                    _jsx("span", { className: "text-xs font-bold text-[#FF0C60] animate-pulse", children: "Cargando..." })]
                }
                )
            }
            ),


            _jsx("div", {
              className: "hidden md:grid grid-cols-7 divide-x divide-border h-full min-w-[1200px]", children:
                dayColumns.map((col, i) => {
                  const isToday = isCurrentRealWeek && new Date().getDay() === i;
                  return (
                    _jsxs("div", {
                      className: `flex flex-col relative group transition-colors ${isToday ? 'bg-[#FF0C60]/[0.02]' : 'hover:bg-muted/10'}`, children: [

                        _jsxs("div", {
                          className: `sticky top-0 z-10 py-3 text-center border-b backdrop-blur-md ${isToday ? 'bg-[#FF0C60]/10 border-[#FF0C60]/20 text-[#FF0C60]' : 'bg-background/80 border-border text-muted-foreground'}`, children: [
                            _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider block mb-0.5", children: col.dateLabel.split(' ')[0] }),
                            _jsx("span", { className: "text-lg font-bold leading-none", children: col.dateLabel.split(' ')[1] })]
                        }
                        ),

                        _jsxs("div", {
                          className: "p-2 space-y-2 flex-1 pb-10", children: [
                            col.shifts.map((item, idx) => {
                              const isActiveNow = isToday && new Date().getHours() >= item.shift.start && new Date().getHours() < (item.shift.end === 0 ? 24 : item.shift.end);
                              return (
                                _jsxs(motion.div, {
                                  initial: { opacity: 0, y: 5 },
                                  animate: { opacity: 1, y: 0 },
                                  transition: { delay: idx * 0.03 },

                                  onClick: () => handleEditClick(item.op, col.dayIndex),
                                  className: `
                                                    relative overflow-hidden rounded-md border p-2 cursor-pointer transition-all duration-200
                                                    hover:shadow-md hover:border-[#FF0C60]/40 group/card
                                                    ${isActiveNow ?
                                      'bg-card border-[#FF0C60] shadow-sm ring-1 ring-[#FF0C60]/20' :
                                      'bg-card border-border shadow-none hover:bg-muted/30'}
                                                `, children: [


                                    isActiveNow && _jsx("div", { className: "absolute top-0 right-0 w-2 h-2 m-1.5 bg-[#FF0C60] rounded-full animate-pulse" }),

                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-2", children: [
                                        _jsxs(Avatar, {
                                          className: "w-6 h-6 rounded-md border border-border", children: [
                                            _jsx(AvatarImage, { src: item.op.image }),
                                            _jsx(AvatarFallback, { className: "rounded-md bg-muted text-[9px] font-bold text-muted-foreground", children: item.op.name.charAt(0) })]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "flex-1 min-w-0", children: [
                                            _jsx("div", { className: "text-[11px] font-bold text-foreground truncate leading-tight", children: item.op.name }),
                                            _jsx("div", {
                                              className: "text-[9px] text-muted-foreground truncate font-medium", children:
                                                item.op.role === 'BOSS' || item.op.role === 'Boss' ? 'Admin' : 'Operador'
                                            }
                                            )]
                                        }
                                        )]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: `
                                                    flex items-center justify-between text-[10px] font-mono px-1.5 py-1 rounded
                                                    ${isActiveNow ? 'bg-[#FF0C60]/10 text-[#FF0C60] font-bold' : 'bg-muted/50 text-muted-foreground'}
                                                `, children: [
                                        _jsx("span", { children: formatTime(item.shift.start) }),
                                        _jsx("span", { className: "opacity-30", children: "-" }),
                                        _jsx("span", { children: formatTime(item.shift.end) })]
                                    }
                                    ),

                                    item.op.isTempSchedule &&
                                    _jsx("div", { className: "absolute bottom-1 right-1 w-1 h-1 bg-amber-500 rounded-full", title: "Horario temporal" })]
                                }, `${item.op.id}-${idx}`

                                ));

                            }),

                            isEditingEnabled &&
                            _jsx("button", {
                              className: "w-full py-1.5 rounded border border-dashed border-border/50 text-xs text-muted-foreground/50 hover:text-[#FF0C60] hover:border-[#FF0C60]/30 hover:bg-[#FF0C60]/5 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1",
                              onClick: () => {
                                if (operators.length > 0) handleEditClick(operators[0], col.dayIndex);
                              }, children:

                                _jsx(Plus, { className: "w-3 h-3" })
                            }
                            )]
                        }

                        )]
                    }, col.dayIndex
                    ));

                })
            }
            ),


            _jsx("div", {
              className: "md:hidden flex flex-col w-full pb-20 divide-y divide-border", children:
                dayColumns.map((col, i) => {
                  const isToday = isCurrentRealWeek && new Date().getDay() === i;
                  return (
                    _jsxs("div", {
                      className: `flex flex-col ${isToday ? 'bg-[#FF0C60]/[0.02]' : ''}`, children: [

                        _jsxs("div", {
                          className: `sticky top-0 z-20 px-4 py-2 flex items-center justify-between backdrop-blur-xl border-b border-border/50 ${isToday ? 'bg-[#FF0C60]/5 border-[#FF0C60]/20' : 'bg-background/90'}`, children: [
                            _jsxs("div", {
                              className: "flex items-baseline gap-2", children: [
                                _jsx("span", { className: `text-sm font-bold capitalize ${isToday ? 'text-[#FF0C60]' : 'text-foreground'}`, children: col.dateLabel.split(' ')[0] }),
                                _jsx("span", { className: "text-xs text-muted-foreground font-medium", children: col.dateLabel.split(' ')[1] })]
                            }
                            ),
                            isToday && _jsx("span", { className: "text-[10px] font-bold text-[#FF0C60] bg-[#FF0C60]/10 px-2 py-0.5 rounded-full", children: "HOY" })]
                        }
                        ),

                        _jsx("div", {
                          className: "p-3 grid grid-cols-1 gap-2", children:
                            col.shifts.length === 0 ?
                              _jsx("div", { className: "text-xs text-muted-foreground/40 italic py-2 text-center", children: "Sin turnos" }) :

                              col.shifts.map((item, idx) =>
                                _jsxs("div", {

                                  onClick: () => handleEditClick(item.op, col.dayIndex),
                                  className: "bg-card border border-border rounded-lg p-3 flex items-center justify-between active:scale-[0.99] transition-transform shadow-sm", children: [

                                    _jsxs("div", {
                                      className: "flex items-center gap-3 overflow-hidden", children: [
                                        _jsxs(Avatar, {
                                          className: "w-9 h-9 border border-border shrink-0", children: [
                                            _jsx(AvatarImage, { src: item.op.image }),
                                            _jsx(AvatarFallback, { className: "text-[10px] bg-muted text-muted-foreground font-bold", children: item.op.name.charAt(0) })]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "min-w-0", children: [
                                            _jsx("div", { className: "font-bold text-sm text-foreground truncate", children: item.op.name }),
                                            _jsx("div", {
                                              className: "text-[10px] text-muted-foreground font-medium flex items-center gap-1.5", children:
                                                item.op.role === 'BOSS' || item.op.role === 'Boss' ?
                                                  _jsxs("span", { className: "text-amber-500 flex items-center gap-1", children: [_jsx(Shield, { className: "w-3 h-3" }), " Admin"] }) :
                                                  'Operador'
                                            }
                                            )]
                                        }
                                        )]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: "flex flex-col items-end shrink-0 pl-2", children: [
                                        _jsx("div", {
                                          className: "text-xs font-mono font-bold text-foreground", children:
                                            formatTime(item.shift.start)
                                        }
                                        ),
                                        _jsx("div", {
                                          className: "text-[10px] font-mono text-muted-foreground", children:
                                            formatTime(item.shift.end)
                                        }
                                        )]
                                    }
                                    )]
                                }, `${item.op.id}-${idx}`
                                )
                              )
                        }

                        )]
                    }, col.dayIndex
                    ));

                })
            }
            )]
        }
        ),


        _jsx(Dialog, {
          open: !!editingState, onOpenChange: (o) => { if (!o) setEditingState(null); }, children:
            _jsxs(DialogContent, {
              className: "bg-card backdrop-blur-2xl border-border text-foreground max-w-lg mb-0 rounded-md shadow-none ring-1 ring-border overflow-hidden p-0 max-h-[85vh] flex flex-col", children: [
                _jsxs("div", {
                  className: "p-6 space-y-6 flex-1 overflow-y-auto", children: [
                    _jsxs("div", {
                      className: "flex justify-between items-start border-b border-border pb-4", children: [
                        _jsxs("div", {
                          children: [
                            _jsx(DialogTitle, { className: "font-bold text-2xl tracking-tight text-foreground", children: "Editar Turno" }

                            ),
                            _jsxs(DialogDescription, {
                              className: "text-muted-foreground text-sm mt-1 flex items-center gap-2", children: [
                                _jsx("span", { className: "w-2 h-2 rounded-full bg-[#FF0C60]" }),
                                editingState && DAYS[editingState.dayIndex], " (", editingState && weekDates[editingState.dayIndex].dateStr, ")"]
                            }
                            )]
                        }
                        ),


                        isEditingEnabled && editingState &&
                        _jsxs(Dialog, {
                          open: confirmingVacation, onOpenChange: setConfirmingVacation, children: [
                            _jsx(DialogTrigger, {
                              asChild: true, children:
                                _jsxs(Button, {
                                  variant: "outline",
                                  size: "sm",
                                  className: "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border-rose-200", children: [

                                    _jsx(Plane, { className: "w-4 h-4 mr-2" }), "Vacaciones"]
                                }

                                )
                            }
                            ),
                            _jsxs(DialogContent, {
                              className: "bg-card border-border max-w-sm", children: [
                                _jsx(DialogTitle, { className: "sr-only", children: "Confirmar Vacaciones" }),
                                _jsx(DialogDescription, { className: "sr-only", children: "Seleccione el rango de fechas para las vacaciones." }),
                                _jsxs("div", {
                                  className: "flex flex-col items-center text-center gap-4 py-4", children: [
                                    _jsx("div", {
                                      className: "w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2", children:
                                        _jsx(CalendarDays, { className: "w-6 h-6" })
                                    }
                                    ),
                                    _jsx("h3", { className: "text-lg font-bold", children: "Planificar Vacaciones" }),
                                    _jsxs("p", {
                                      className: "text-sm text-muted-foreground", children: ["Seleccione el rango de fechas.",

                                        _jsx("br", {}),
                                        _jsx("span", { className: "text-xs opacity-70", children: "Los turnos en este periodo ser\xE1n eliminados." })]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: "grid grid-cols-2 gap-4 w-full mt-2 text-left", children: [
                                        _jsxs("div", {
                                          className: "space-y-1", children: [
                                            _jsx("label", { className: "text-[10px] font-bold text-muted-foreground", children: "Desde" }),
                                            _jsx(Input, {
                                              type: "date",
                                              value: vacationStart,
                                              onChange: (e) => setVacationStart(e.target.value),
                                              className: "bg-muted/10 border-border text-xs"
                                            }
                                            )]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "space-y-1", children: [
                                            _jsx("label", { className: "text-[10px] font-bold text-muted-foreground", children: "Hasta" }),
                                            _jsx(Input, {
                                              type: "date",
                                              value: vacationEnd,
                                              onChange: (e) => setVacationEnd(e.target.value),
                                              className: "bg-muted/10 border-border text-xs"
                                            }
                                            )]
                                        }
                                        )]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: "flex gap-3 w-full mt-4", children: [
                                        _jsx(Button, { variant: "ghost", onClick: () => setConfirmingVacation(false), className: "flex-1", children: "Cancelar" }),
                                        _jsx(Button, { onClick: handleVacationMode, disabled: !vacationStart || !vacationEnd, className: "flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50", children: "Aplicar" }

                                        )]
                                    }
                                    )]
                                }
                                )]
                            }
                            )]
                        }
                        )]
                    }

                    ),

                    _jsxs("div", {
                      className: "space-y-4", children: [
                        editingState?.shifts.length === 0 &&
                        _jsx("div", { className: "text-center text-slate-500 text-sm py-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]", children: "No hay turnos asignados." }

                        ),


                        editingState?.shifts.map((shift) =>
                          _jsxs("div", {
                            className: "bg-muted/30 p-5 rounded-2xl border border-border space-y-5 relative group shadow-sm", children: [


                              _jsxs("div", {
                                className: "space-y-2", children: [
                                  _jsx("div", { className: "text-[10px] font-bold text-muted-foreground tracking-tight", children: "D\xEDas aplicables" }),
                                  _jsx("div", {
                                    className: "flex gap-1 flex-wrap", children:
                                      ['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, index) => {
                                        const isSelected = shift.days.includes(index);
                                        return (
                                          _jsx("button", {

                                            onClick: () => {
                                              const newDays = isSelected ?
                                                shift.days.filter((d) => d !== index) :
                                                [...shift.days, index];
                                              updateEditingShift(shift.tempId, 'days', newDays);
                                            },
                                            className: `
                                                            w-8 h-8 rounded-md text-xs font-bold transition-all border
                                                            ${isSelected ?
                                                'bg-[#FF0C60] text-white border-[#FF0C60] shadow-md shadow-[#FF0C60]/20' :
                                                'bg-card text-muted-foreground border-border hover:bg-muted hover:border-border'}
                                                        `,

                                            title: DAYS[index], children:

                                              dayLabel
                                          }, index
                                          ));

                                      })
                                  }
                                  )]
                              }
                              ),

                              _jsxs("div", {
                                className: "flex justify-between items-start gap-4", children: [
                                  _jsxs("div", {
                                    className: "space-y-1.5 flex-1", children: [
                                      _jsx("div", { className: "text-[10px] font-bold text-muted-foreground tracking-tight", children: "Horario" }),
                                      _jsxs("div", {
                                        className: "flex items-center gap-2 w-full", children: [
                                          _jsxs(Select, {
                                            value: String(shift.start), onValueChange: (v) => updateEditingShift(shift.tempId, 'start', Number(v)), children: [
                                              _jsx(SelectTrigger, { className: "h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground font-bold", children: _jsx(SelectValue, {}) }),
                                              _jsx(SelectContent, {
                                                className: "bg-card border-border", children:
                                                  Array.from({ length: 24 }, (_, i) => i).map((h) => _jsx(SelectItem, { value: String(h), children: formatTime(h) }, h))
                                              }
                                              )]
                                          }
                                          ),
                                          _jsx("span", { className: "text-muted-foreground font-bold", children: "-" }),
                                          _jsxs(Select, {
                                            value: String(shift.end), onValueChange: (v) => updateEditingShift(shift.tempId, 'end', Number(v)), children: [
                                              _jsx(SelectTrigger, { className: "h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground font-bold", children: _jsx(SelectValue, {}) }),
                                              _jsx(SelectContent, {
                                                className: "bg-card border-border", children:
                                                  Array.from({ length: 25 }, (_, i) => i).map((h) => _jsx(SelectItem, { value: String(h), children: formatTime(h) }, h))
                                              }
                                              )]
                                          }
                                          )]
                                      }
                                      )]
                                  }
                                  ),
                                  _jsx(Button, {
                                    variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 -mt-1", onClick: () => removeShiftFromEdit(shift.tempId), children:
                                      _jsx(Trash2, { className: "w-4 h-4" })
                                  }
                                  )]
                              }
                              ),

                              _jsxs("div", {
                                className: "space-y-1.5", children: [
                                  _jsx("div", { className: "text-[10px] font-bold text-muted-foreground tracking-tight", children: "Asignado a" }),
                                  _jsxs(Select, {
                                    value: shift.targetOpId, onValueChange: (v) => updateEditingShift(shift.tempId, 'targetOpId', v), children: [
                                      _jsx(SelectTrigger, {
                                        className: `h-10 text-sm border-border rounded-md ${shift.targetOpId !== editingState.originalOpId ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold' : 'bg-card text-foreground'}`, children:
                                          _jsx(SelectValue, {})
                                      }
                                      ),
                                      _jsx(SelectContent, {
                                        className: "bg-card border-border", children:
                                          operators.map((op) =>
                                            _jsx(SelectItem, { value: op.id, children: op.name }, op.id)
                                          )
                                      }
                                      )]
                                  }
                                  )]
                              }
                              ),

                              shift.targetOpId !== editingState.originalOpId &&
                              _jsxs("div", {
                                className: "bg-amber-500/10 text-amber-500/90 p-2.5 rounded-md text-xs flex items-center gap-2 border border-amber-500/20", children: [
                                  _jsx(User, { className: "w-3 h-3" }), " Se mover\xE1 a ", _jsx("span", { className: "font-bold", children: operators.find((o) => o.id === shift.targetOpId)?.name })]
                              }
                              )]
                          }, shift.tempId

                          )
                        ),

                        _jsxs(Button, {
                          variant: "outline", onClick: addNewShiftToEdit, className: "w-full h-12 border-dashed border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all", children: [
                            _jsx(Plus, { className: "w-4 h-4 mr-2" }), " Agregar Turno"]
                        }
                        )]
                    }
                    )]
                }
                ),

                _jsxs("div", {
                  className: "p-4 bg-muted/20 border-t border-border flex gap-3", children: [
                    _jsx(Button, { variant: "ghost", onClick: () => setEditingState(null), className: "flex-1 rounded-md hover:bg-muted/50", children: "Cancelar" }),
                    _jsx(Button, { className: "bg-[#FF0C60] hover:bg-[#d90a50] text-white flex-1 rounded-md shadow-lg shadow-rose-900/20 transition-all font-bold tracking-wide", onClick: saveChanges, children: "Guardar Cambios" })]
                }
                )]
            }
            )
        }
        )]
    }
    ));

}