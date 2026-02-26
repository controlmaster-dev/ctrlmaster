"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Edit2, Bell, X, Settings } from "lucide-react";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { getBitcentralUser } from "@/lib/schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"; export function BitcentralWidget({ users }: { users: Array<{ id: string; name: string }> }) {
  const [today, setToday] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [overrides, setOverrides] = useState<Array<{ date: string; user: { name: string } }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; name: string; isActive: boolean; startDate: string; endDate: string }>>([]);
  const [baseSchedule, setBaseSchedule] = useState<Array<{ dayOfWeek: number; user?: { name: string; id: string }; userId: string }>>([]);
  const [selectedDate, setSelectedDate] = useState(null);
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
        fetch(`/api/schedule?start=${weekStart.toISOString()}&end=${end.toISOString()}`),
        fetch('/api/special-events'),
        fetch('/api/schedule/config')]
      );

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
  }, {});


  const overrideMap = overrides.reduce((acc, curr) => {
    acc[new Date(curr.date).toDateString()] = curr.user.name;
    return acc;
  }, {});


  const getDisplayInfo = (date) => {

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
    if (isLoading) return;

    const checkReminder = () => {
      const now = new Date();
      let targetDate = new Date(now);


      if (now.getHours() >= 2) {
        targetDate = addDays(now, 1);
      }

      const info = getDisplayInfo(targetDate);


      if ('isEvent' in info && info.isEvent) {
        toast.dismiss('shift-reminder');
        return;
      }


      const dateLabel = format(targetDate, "EEEE", { locale: es });
      const formattedDateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

      toast("Recordatorio de Pauta", {
        description: _jsxs("span", {
          children: [
            _jsx("span", { className: "text-foreground font-semibold", children: info.name }),
            ", toca preparar la playlist del ",
            _jsx("span", { className: "text-yellow-600 dark:text-yellow-500 font-bold", children: formattedDateLabel }),
            "."
          ]
        }),
        icon: _jsx(Bell, { className: "w-5 h-5 text-yellow-500" }),
        id: 'shift-reminder',
        duration: Infinity,
        position: 'bottom-center',
        className: "mb-20 md:mb-0",
      });
    };

    if (overrides !== undefined && events !== undefined) {
      checkReminder();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, events, overrides, baseSchedule, isLoading]);

  const handleOverride = async (userId) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return;
    const res = await fetch('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ date: selectedDate.toISOString(), userId })
    });
    if (res.ok) {
      fetchData();
      setSelectedDate(null);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName || !newEventStart || !newEventEnd) return;

    const res = await fetch('/api/special-events', {
      method: 'POST',
      body: JSON.stringify({
        name: newEventName,
        startDate: newEventStart.toISOString(),
        endDate: newEventEnd.toISOString()
      })
    });

    if (res.ok) {
      fetchData();
      setNewEventName("");
      setIsManageEventsOpen(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    const res = await fetch(`/api/special-events?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleSaveConfig = async (newSchedule) => {
    const res = await fetch('/api/schedule/config', {
      method: 'POST',
      body: JSON.stringify({ schedule: newSchedule })
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

  const getInitials = (name) => {
    return (name || "").split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    _jsxs(Card, {
      className: "bg-card backdrop-blur-md md:backdrop-blur-xl border-border shadow-sm overflow-hidden ring-1 ring-border rounded-xl relative", children: [
        _jsxs(CardHeader, {
          className: "p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0", children: [
            _jsxs("div", {
              className: "flex items-center gap-3", children: [
                _jsx("div", {
                  className: "h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]", children:
                    _jsx(CalIcon, { className: "w-4 h-4 text-blue-500" })
                }
                ),
                _jsx("span", { className: "font-semibold text-foreground text-sm tracking-tight", children: "Pauta Bitcentral" })]
            }
            ),
            _jsxs("div", {
              className: "flex items-center gap-1", children: [
                _jsx(Button, {
                  variant: "ghost", size: "icon", className: "h-6 w-6 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10", onClick: () => setIsConfigOpen(true), title: "Configurar Horario Base", children:
                    _jsx(Settings, { className: "w-3 h-3" })
                }
                ),
                _jsx(Button, {
                  variant: "ghost", size: "icon", className: "h-6 w-6 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10", onClick: () => setIsManageEventsOpen(true), title: "Gestionar Eventos", children:
                    _jsx(Edit2, { className: "w-3 h-3" })
                }
                ),
                _jsxs("div", {
                  className: "flex items-center bg-muted/20 rounded-lg p-0.5 border border-border ml-2", children: [
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", onClick: () => setWeekStart(addDays(weekStart, -7)), children:
                        _jsx(ChevronLeft, { className: "w-3 h-3" })
                    }
                    ),
                    _jsxs("span", {
                      className: "text-[10px] font-mono text-muted-foreground px-2 min-w-[80px] text-center select-none", children: [
                        format(weekStart, 'd MMM', { locale: es }), " - ", format(addDays(weekStart, 6), 'd MMM', { locale: es })]
                    }
                    ),
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", onClick: () => setWeekStart(addDays(weekStart, 7)), children:
                        _jsx(ChevronRight, { className: "w-3 h-3" })
                    }
                    )]
                }
                )]
            }
            )]
        }
        ),
        _jsx(CardContent, {
          className: "p-3", children:
            _jsx("div", {
              className: "flex flex-col gap-2", children:
                isLoading ?

                  Array.from({ length: 7 }).map((_, i) =>
                    _jsxs("div", {
                      className: "flex items-center gap-3 p-3 border-l-[3px] border-transparent bg-muted/10 animate-pulse rounded-lg", children: [
                        _jsxs("div", {
                          className: "flex flex-col items-center justify-center w-12 shrink-0 gap-1", children: [
                            _jsx("div", { className: "h-2 w-6 bg-muted rounded" }),
                            _jsx("div", { className: "h-4 w-4 bg-muted rounded" })]
                        }
                        ),
                        _jsx("div", { className: "h-8 w-px bg-border/50" }),
                        _jsxs("div", {
                          className: "flex-1 flex items-center gap-3", children: [
                            _jsx("div", { className: "h-8 w-8 rounded-full bg-muted" }),
                            _jsxs("div", {
                              className: "flex flex-col gap-1.5 w-full", children: [
                                _jsx("div", { className: "h-3 w-24 bg-muted rounded" }),
                                _jsx("div", { className: "h-2 w-16 bg-muted rounded" })]
                            }
                            )]
                        }
                        )]
                    }, i
                    )
                  ) :

                  days.map((date) => {
                    const info = getDisplayInfo(date) as { name: string; isEvent?: boolean; eventId?: string; isOverride?: boolean; isRotation?: boolean };
                    const isToday = isSameDay(date, today);
                    const toISO = (d) => isNaN(d.getTime()) ? `invalid-${Math.random()}` : d.toISOString();


                    if (info.isEvent) {
                      return (
                        _jsxs("div", {
                          className: `group flex items-center gap-3 p-3 transition-all border-l-[3px] bg-yellow-500/5 border-yellow-500`, children: [

                            _jsxs("div", {
                              className: "flex flex-col items-center justify-center w-12 shrink-0", children: [
                                _jsx("span", { className: "text-[9px] font-bold text-yellow-600/70 tracking-tight", children: format(date, 'EEE', { locale: es }) }),
                                _jsx("span", { className: `text-lg font-light leading-none mt-0.5 text-yellow-500`, children: format(date, 'd') })]
                            }
                            ),
                            _jsx("div", { className: "h-8 w-px bg-yellow-500/20" }),
                            _jsxs("div", {
                              className: "flex-1 flex items-center gap-3 min-w-0", children: [
                                _jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors bg-yellow-500/10 text-yellow-500 border-yellow-500/30`, children: "\u2605" }

                                ),
                                _jsxs("div", {
                                  className: "flex flex-col min-w-0", children: [
                                    _jsx("span", {
                                      className: "text-sm font-bold truncate text-yellow-500", children:
                                        info.name
                                    }
                                    ),
                                    _jsx("span", { className: "text-[10px] text-yellow-600/70 font-medium", children: "Sin horario definido" })]
                                }
                                )]
                            }
                            )]
                        }, toISO(date)
                        ));

                    }

                    return (
                      _jsxs("div", {
                        className: `group flex items-center gap-3 p-3 transition-all cursor-pointer border-l-[3px] ${isToday ? 'bg-blue-500/5 border-blue-500 shadow-inner' : 'hover:bg-muted/30 border-transparent hover:border-border'}`,
                        onClick: () => setSelectedDate(date), children: [


                          _jsxs("div", {
                            className: "flex flex-col items-center justify-center w-12 shrink-0", children: [
                              _jsx("span", { className: "text-[9px] font-bold text-muted-foreground tracking-tight", children: format(date, 'EEE', { locale: es }) }),
                              _jsx("span", { className: `text-lg font-light leading-none mt-0.5 ${isToday ? 'text-blue-400 font-normal' : 'text-foreground'}`, children: format(date, 'd') })]
                          }
                          ),


                          _jsx("div", { className: "h-8 w-px bg-border" }),


                          _jsxs("div", {
                            className: "flex-1 flex items-center gap-3 min-w-0", children: [

                              _jsx("div", {
                                className: `h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${isToday ?
                                  'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]' :
                                  'bg-secondary text-muted-foreground border-border group-hover:border-foreground/20'}`, children:

                                  getInitials(info.name)
                              }
                              ),
                              _jsxs("div", {
                                className: "flex flex-col min-w-0", children: [
                                  _jsx("span", {
                                    className: `text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground group-hover:text-foreground transition-colors'}`, children:
                                      info.name
                                  }
                                  ),
                                  _jsx("div", {
                                    className: "flex items-center gap-2", children:
                                      info.isOverride ?
                                        _jsxs("span", {
                                          className: "flex items-center gap-1.5 text-[10px] text-yellow-500 font-medium", children: [
                                            _jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" }), "Cambio manual"]
                                        }

                                        ) :
                                        info.isRotation ?
                                          _jsxs("span", {
                                            className: "flex items-center gap-1.5 text-[10px] text-purple-500 font-medium", children: [
                                              _jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]" }), "Rotativo"]
                                          }

                                          ) :

                                          _jsxs("span", {
                                            className: "text-[10px] text-slate-600 font-medium flex items-center gap-1.5", children: [
                                              _jsx("span", { className: "w-1 h-1 rounded-full bg-slate-700" }), "Regular"]
                                          }

                                          )
                                  }

                                  )]
                              }
                              )]
                          }
                          ),


                          _jsx("div", {
                            className: "pr-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2 duration-300", children:
                              _jsx("div", {
                                className: "p-1.5 rounded-md bg-muted text-foreground hover:bg-blue-500 hover:text-white hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all", children:
                                  _jsx(Edit2, { className: "w-3.5 h-3.5" })
                              }
                              )
                          }
                          )]
                      }, toISO(date)
                      ));

                  })
            }

            )
        }
        ),


        _jsx(Dialog, {
          open: isConfigOpen, onOpenChange: setIsConfigOpen, children:
            _jsxs(DialogContent, {
              className: "bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl max-w-lg", children: [
                _jsx(DialogHeader, {
                  children:
                    _jsxs(DialogTitle, {
                      className: "flex items-center gap-2 text-foreground", children: [
                        _jsx(Settings, { className: "w-5 h-5 text-blue-500" }), "Configuraci\xF3n de Horario Base"]
                    }

                    )
                }
                ),
                _jsxs("div", {
                  className: "space-y-4 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2", children: [
                    _jsx("p", { className: "text-sm text-muted-foreground", children: "Define el operador predeterminado para cada d\xEDa de la semana. Los cambios aplicar\xE1n a todas las semanas futuras excepto donde haya modificaciones manuales." }),
                    _jsxs("form", {
                      onSubmit: (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const updates = [];


                        for (let i = 0; i < 7; i++) {
                          const userId = formData.get(`day-${i}`);
                          if (userId && userId !== 'default') {
                            updates.push({ dayOfWeek: i, userId });
                          }
                        }
                        handleSaveConfig(updates);
                      }, className: "space-y-3", children: [
                        [1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {

                          const dayName = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex === 0 ? 6 : dayIndex - 1), 'EEEE', { locale: es });

                          const currentConfig = baseSchedule.find((s) => s.dayOfWeek === dayIndex);

                          return (
                            _jsxs("div", {
                              className: "flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border", children: [
                                _jsx("span", { className: "capitalize font-medium text-sm w-24 text-foreground", children: dayName }),
                                _jsxs(Select, {
                                  name: `day-${dayIndex}`, defaultValue: currentConfig?.userId || "default", children: [
                                    _jsx(SelectTrigger, {
                                      className: "w-[200px] h-9 text-sm bg-background border-input", children:
                                        _jsx(SelectValue, { placeholder: "Seleccionar..." })
                                    }
                                    ),
                                    _jsxs(SelectContent, {
                                      children: [
                                        _jsx(SelectItem, { value: "default", className: "text-muted-foreground font-light", children: "Sin asignar (Legacy)" }),
                                        users.map((u) =>
                                          _jsx(SelectItem, { value: u.id, children: u.name }, u.id)
                                        )]
                                    }
                                    )]
                                }
                                )]
                            }, dayIndex
                            ));

                        }),

                        _jsxs("div", {
                          className: "pt-4 flex justify-end gap-2", children: [
                            _jsx(Button, { variant: "outline", type: "button", onClick: () => setIsConfigOpen(false), children: "Cancelar" }),
                            _jsx(Button, { type: "submit", className: "bg-blue-600 hover:bg-blue-700 text-white", children: "Guardar Cambios" })]
                        }
                        )]
                    }
                    )]
                }
                )]
            }
            )
        }
        ),


        _jsx(Dialog, {
          open: !!selectedDate, onOpenChange: (o) => { if (!o) setSelectedDate(null); }, children:
            _jsxs(DialogContent, {
              className: "bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl", children: [
                _jsx(DialogHeader, {
                  children:
                    _jsxs(DialogTitle, {
                      className: "flex items-center gap-2 text-foreground", children: [
                        _jsx(Edit2, { className: "w-5 h-5 text-blue-500" }), "Editar Horario: ",
                        _jsx("span", { className: "text-blue-500", children: selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: es }) })]
                    }
                    )
                }
                ),
                _jsx("div", {
                  className: "space-y-4 pt-4", children:
                    _jsxs("div", {
                      className: "p-4 rounded-xl bg-muted/50 border border-border", children: [
                        _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "Selecciona qui\xE9n cubrir\xE1 este turno (Modo Vacaciones/Cambio):" }),
                        _jsxs(Select, {
                          onValueChange: handleOverride, children: [
                            _jsx(SelectTrigger, {
                              className: "bg-background border-input focus:ring-blue-500/50 text-foreground h-11", children:
                                _jsx(SelectValue, { placeholder: "Seleccionar operador..." })
                            }
                            ),
                            _jsxs(SelectContent, {
                              className: "bg-popover border-border text-popover-foreground", children: [
                                _jsx(SelectItem, {
                                  value: "reset", className: "text-red-500 focus:text-red-600 font-bold focus:bg-red-500/10", children:
                                    _jsxs("div", {
                                      className: "flex items-center gap-2", children: [
                                        _jsx("span", { children: "\uD83D\uDD01" }), " Restaurar Original"]
                                    }
                                    )
                                }
                                ),
                                users.map((u) =>
                                  _jsx(SelectItem, { value: u.id, className: "focus:bg-accent focus:text-accent-foreground", children: u.name }, u.id)
                                )]
                            }
                            )]
                        }
                        )]
                    }
                    )
                }
                )]
            }
            )
        }
        ),


        _jsx(Dialog, {
          open: isManageEventsOpen, onOpenChange: setIsManageEventsOpen, children:
            _jsxs(DialogContent, {
              className: "bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl", children: [
                _jsx(DialogHeader, {
                  children:
                    _jsx(DialogTitle, { className: "flex items-center gap-2 text-yellow-500", children: "\u2605 Gestionar Eventos Especiales" }

                    )
                }
                ),
                _jsxs("div", {
                  className: "space-y-6 pt-4", children: [

                    _jsxs("div", {
                      className: "p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-4", children: [
                        _jsx("h4", { className: "text-sm font-semibold text-yellow-600 dark:text-yellow-400", children: "Nuevo Evento" }),
                        _jsxs("div", {
                          className: "grid gap-3", children: [
                            _jsx("input", {
                              placeholder: "Nombre (ej. Marat\xF3nica)",
                              className: "w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground",
                              value: newEventName,
                              onChange: (e) => setNewEventName(e.target.value)
                            }
                            ),
                            _jsxs("div", {
                              className: "grid grid-cols-2 gap-3", children: [
                                _jsxs("div", {
                                  className: "space-y-1", children: [
                                    _jsx("label", { className: "text-xs text-muted-foreground", children: "Inicio" }),
                                    _jsx("input", {
                                      type: "date", className: "w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground",
                                      value: newEventStart ? format(newEventStart, 'yyyy-MM-dd') : '',
                                      onChange: (e) => setNewEventStart(new Date(e.target.value + 'T12:00:00'))
                                    }
                                    )]
                                }
                                ),
                                _jsxs("div", {
                                  className: "space-y-1", children: [
                                    _jsx("label", { className: "text-xs text-muted-foreground", children: "Fin" }),
                                    _jsx("input", {
                                      type: "date", className: "w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground",
                                      value: newEventEnd ? format(newEventEnd, 'yyyy-MM-dd') : '',
                                      onChange: (e) => setNewEventEnd(new Date(e.target.value + 'T12:00:00'))
                                    }
                                    )]
                                }
                                )]
                            }
                            ),
                            _jsx(Button, { className: "w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-9", onClick: handleCreateEvent, children: "Crear Evento" }

                            )]
                        }
                        )]
                    }
                    ),


                    _jsxs("div", {
                      className: "space-y-2", children: [
                        _jsx("h4", { className: "text-sm font-semibold text-muted-foreground", children: "Eventos Activos" }),
                        _jsxs("div", {
                          className: "max-h-[200px] overflow-y-auto custom-scrollbar space-y-2", children: [
                            events.map((event) =>
                              _jsxs("div", {
                                className: "flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border", children: [
                                  _jsxs("div", {
                                    children: [
                                      _jsx("div", { className: "font-medium text-foreground text-sm", children: event.name }),
                                      _jsxs("div", {
                                        className: "text-xs text-muted-foreground", children: [
                                          format(new Date(event.startDate), 'd MMM'), " - ", format(new Date(event.endDate), 'd MMM')]
                                      }
                                      )]
                                  }
                                  ),
                                  _jsx(Button, {
                                    variant: "ghost", size: "icon", className: "h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-500/10", onClick: () => handleDeleteEvent(event.id), children:
                                      _jsx("div", { className: "w-4 h-4", children: "\xD7" })
                                  }
                                  )]
                              }, event.id
                              )
                            ),
                            events.length === 0 && _jsx("p", { className: "text-center text-xs text-muted-foreground py-4", children: "No hay eventos programados." })]
                        }
                        )]
                    }
                    )]
                }
                )]
            }
            )
        }
        )]
    }
    ));

}