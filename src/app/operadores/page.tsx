"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, Shield, Calendar, Info, Download, Home, Calendar as CalIcon } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";




























export default function OperatorsPage() {
  const { user } = useAuth();

  const getInitialWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const d = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${d}`;
  };

  const [currentRealWeek] = useState(getInitialWeekStart());
  const [modalWeekStart, setModalWeekStart] = useState(getInitialWeekStart());
  const [operators, setOperators] = useState([]);
  const [modalOperators, setModalOperators] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeksDuration, setWeeksDuration] = useState(4);
  const [specialEvents, setSpecialEvents] = useState<{ name: string; isActive: boolean; startDate: string; endDate: string }[]>([]);





  const getDayRangeLabel = (days) => {
    if (!days || days.length === 0) return '';
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie';
    if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab';
    if (sorted.length === 7) return 'Todos los días';
    if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem';
    return sorted.map((d) => dayNames[d]).join(',');
  };

  const formatTime = (hour) => {
    const ampm = hour >= 12 ? 'pm' : 'am';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/special-events');
        if (res.ok) {
          const data = await res.json();
          setSpecialEvents(data);
        }
      } catch (e) {
        console.error("Error fetching special events:", e);
      }
    };
    fetchEvents();
  }, []);


  useEffect(() => {
    const fetchMainOperators = async () => {
      try {
        const res = await fetch(`/api/users?weekStart=${currentRealWeek}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Error fetching main users");
        const data = await res.json();
        const sorted = sortOperators(data);
        setOperators(sorted);
        calculatePredictions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMainOperators();
    const timer = setInterval(() => fetchMainOperators(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRealWeek]);

  const [isModalLoading, setIsModalLoading] = useState(false);


  useEffect(() => {
    const fetchModalOperators = async () => {
      setIsModalLoading(true);
      try {
        const res = await fetch(`/api/users?weekStart=${modalWeekStart}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Error fetching modal users");
        const data = await res.json();
        const sorted = sortOperators(data);
        setModalOperators(sorted);
      } catch (e) {
        console.error(e);
      } finally {

        setTimeout(() => setIsModalLoading(false), 300);
      }
    };
    fetchModalOperators();
  }, [modalWeekStart]);

  const sortOperators = (data: Array<{ isAvailable?: boolean;[key: string]: unknown }>) => {
    return data.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });
  };

  const calculatePredictions = (ops) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    const futureShifts = [];

    ops.forEach((op) => {
      if (!op.shifts || op.isAvailable) return;

      op.shifts.forEach((shift) => {
        if (!shift.days || shift.days.length === 0) return;

        let daysUntil = -1;
        const sortedDays = [...shift.days].sort((a, b) => a - b);
        let nextDay = sortedDays.find((d) => d >= currentDay);

        if (nextDay === currentDay) {
          if (currentHour < shift.start) {
            daysUntil = 0;
          } else {
            nextDay = sortedDays.find((d) => d > currentDay);
          }
        }

        if (nextDay === undefined) {
          nextDay = sortedDays[0];
          daysUntil = 7 - currentDay + nextDay;
        } else {
          if (daysUntil === -1) {
            daysUntil = nextDay - currentDay;
          }
        }

        const startHour = shift.start;
        let totalHoursAway = daysUntil * 24 + (startHour - currentHour);
        if (totalHoursAway < 0) totalHoursAway += 24 * 7;

        futureShifts.push({
          op,
          hoursUntil: totalHoursAway,
          shift
        });
      });
    });

    futureShifts.sort((a, b) => a.hoursUntil - b.hoursUntil);

    const uniquePredictions = [];
    const seenOps = new Set();

    for (const item of futureShifts) {
      if (seenOps.has(item.op.id)) continue;
      if (uniquePredictions.length >= 2) break;

      seenOps.add(item.op.id);

      let timeLabel = "";
      if (item.hoursUntil < 1) timeLabel = "En menos de 1h"; else
        if (item.hoursUntil < 24) timeLabel = `En ${Math.floor(item.hoursUntil)}h`; else
          timeLabel = `En ${Math.floor(item.hoursUntil / 24)}d ${Math.floor(item.hoursUntil % 24)}h`;

      uniquePredictions.push({
        nextOperator: item.op,
        timeUntil: timeLabel,
        shiftLabel: `${getDayRangeLabel(item.shift.days)} ${formatTime(item.shift.start)}-${formatTime(item.shift.end)}`
      });
    }

    setPredictions(uniquePredictions);
  };

  const getCurrentShiftStats = (op) => {
    if (!op.shifts) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    const activeShift = op.shifts.find((s) => {
      const isDay = s.days.includes(currentDay);
      const end = s.end === 0 ? 24 : s.end;
      return isDay && currentHour >= s.start && currentHour < end;
    });

    if (!activeShift) return null;

    const start = activeShift.start;
    const end = activeShift.end === 0 ? 24 : activeShift.end;
    const duration = end - start;
    const elapsed = currentHour - start;


    const progress = Math.min(100, Math.max(0, elapsed / duration * 100));


    const remainingHours = end - currentHour;
    const remainingH = Math.floor(remainingHours);
    const remainingM = Math.round((remainingHours - remainingH) * 60);

    const label = `${formatTime(activeShift.start)} - ${formatTime(activeShift.end)}`;

    return {
      progress,
      remaining: `${remainingH}h ${remainingM}m`,
      label
    };
  };



  const getActiveEvent = () => {
    if (!specialEvents || specialEvents.length === 0) return null;
    const now = new Date();
    return specialEvents.find((e) => {
      if (!e.isActive) return false;
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return now >= start && now <= end;
    });
  };
  const translateRole = (role) => {
    switch (role) {
      case 'OPERATOR': return 'OPERADOR';
      case 'ENGINEER': return 'INGENIERO';
      case 'BOSS': return 'ADMINISTRADOR';
      default: return role;
    }
  };

  const handleSubscribe = (isWebCal) => {
    const myOp = modalOperators.find((op) => op.id === user?.id || op.name === user?.name);
    if (myOp) {
      let baseUrl = `${window.location.origin}/api/calendar/${myOp.id}?weeks=${weeksDuration}`;


      if (baseUrl.includes('0.0.0.0')) {
        baseUrl = baseUrl.replace('0.0.0.0', 'localhost');
      }

      if (isWebCal) {

        const webcalUrl = baseUrl.replace(/^https?:/, 'webcal:');
        window.location.href = webcalUrl;
      } else {

        window.open(baseUrl, '_blank');
      }
    } else {
      alert("No se pudo identificar tu usuario operador.");
    }
  };

  return (
    _jsxs("div", {
      className: "min-h-screen text-foreground selection:bg-[#FF0C60] selection:text-white", children: [


        _jsxs("header", {
          className: "fixed top-0 left-0 right-0 z-40 px-4 md:px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-xl border-b border-border", children: [
            _jsx("div", {
              className: "flex items-center gap-3", children:
                _jsxs(Link, {
                  href: "/", className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [
                    _jsx("img", { src: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png", alt: "Logo", className: "w-8 h-8 object-contain" }),
                    _jsx("span", { className: "font-bold text-lg tracking-tight hidden md:block text-foreground", children: "Control Master" })]
                }
                )
            }
            ),

            _jsxs("div", {
              className: "flex items-center gap-2", children: [
                _jsx(ThemeToggle, {}),

                _jsx(Link, {
                  href: "/", children:
                    _jsx(Button, {
                      variant: "outline", size: "icon", className: "border-border bg-card text-muted-foreground hover:text-[#FF0C60] hover:bg-rose-500/10 rounded-md h-10 w-10", children:
                        _jsx(Home, { className: "w-5 h-5" })
                    }
                    )
                }
                ),


                _jsxs(Dialog, {
                  children: [
                    _jsx(DialogTrigger, {
                      asChild: true, children:
                        _jsxs(Button, {
                          variant: "outline", className: "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted gap-2 backdrop-blur-md", children: [
                            _jsx(Calendar, { className: "w-4 h-4" }),
                            _jsx("span", { className: "hidden md:inline", children: "Ver Calendario Completo" })]
                        }
                        )
                    }
                    ),
                    _jsxs(DialogContent, {
                      className: "w-full h-full md:h-[90vh] md:max-w-screen-2xl bg-card backdrop-blur-xl border-border text-card-foreground p-0 overflow-hidden shadow-none ring-1 ring-border flex flex-col rounded-none md:rounded-lg duration-500 data-[state=open]:duration-500 data-[state=closed]:duration-500 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100", children: [
                        _jsxs("div", {
                          className: "p-6 border-b border-border flex justify-between items-center", children: [
                            _jsxs("div", {
                              children: [
                                _jsx(DialogTitle, { className: "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground", children: "Distribuci\xF3n Semanal" }

                                ),
                                _jsx(DialogDescription, { className: "text-muted-foreground text-sm", children: "Vista global de turnos de todos los operadores." }

                                )]
                            }
                            ),
                            _jsx("div", {
                              className: "flex gap-4 items-center", children:
                                user &&
                                _jsxs("div", {
                                  className: "flex items-center gap-2", children: [

                                    _jsxs("div", {
                                      className: "relative", children: [
                                        _jsxs("select", {
                                          className: "bg-muted/50 border border-border text-foreground text-xs rounded-md px-2 py-2 outline-none focus:border-ring appearance-none pr-8 cursor-pointer",
                                          value: weeksDuration,
                                          onChange: (e) => setWeeksDuration(Number(e.target.value)), children: [

                                            _jsx("option", { value: 4, children: "4 Semanas" }),
                                            _jsx("option", { value: 8, children: "8 Semanas" }),
                                            _jsx("option", { value: 12, children: "3 Meses" }),
                                            _jsx("option", { value: 24, children: "6 Meses" })]
                                        }
                                        ),
                                        _jsx("div", {
                                          className: "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50", children:
                                            _jsx(Calendar, { className: "w-3 h-3" })
                                        }
                                        )]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: "flex bg-muted/50 rounded-md border border-border p-0.5", children: [
                                        _jsxs(Button, {
                                          onClick: () => handleSubscribe(true),
                                          variant: "ghost",
                                          size: "sm",
                                          className: "text-xs h-8 gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all", children: [

                                            _jsx(Calendar, { className: "w-3.5 h-3.5" }), "Suscribir"]
                                        }

                                        ),

                                        _jsx("div", { className: "w-[1px] bg-slate-200 my-1 mx-0.5" }),

                                        _jsx(Button, {
                                          onClick: () => handleSubscribe(false),
                                          variant: "ghost",
                                          size: "icon",
                                          className: "h-8 w-8 text-slate-400 hover:text-slate-700",
                                          title: "Descargar Archivo .ics", children:

                                            _jsx(Download, { className: "w-3.5 h-3.5" })
                                        }
                                        )]
                                    }
                                    )]
                                }
                                )
                            }

                            )]
                        }
                        ),
                        _jsx("div", {
                          className: "p-0 md:p-6 flex-1 flex flex-col overflow-hidden", children:
                            _jsx(WeeklyCalendar, {
                              operators: modalOperators,
                              currentWeekStart: modalWeekStart,
                              onWeekChange: setModalWeekStart,
                              isLoading: isModalLoading
                            }
                            )
                        }
                        )]
                    }
                    )]
                }
                ),

                user ?
                  _jsxs("div", {
                    className: "flex items-center gap-3 pl-4 border-l border-border", children: [
                      _jsxs("div", {
                        className: "hidden md:block text-right", children: [
                          _jsx("div", { className: "text-sm font-bold text-foreground", children: user.name }),
                          _jsx("div", { className: "text-[10px] text-muted-foreground tracking-tight font-bold", children: translateRole(user.role) })]
                      }
                      ),
                      _jsx(Link, {
                        href: "/", children:
                          _jsxs(Avatar, {
                            className: "w-9 h-9 border border-border cursor-pointer hover:border-[#FF0C60] transition-all", children: [
                              _jsx(AvatarImage, { src: user.avatar }),
                              _jsx(AvatarFallback, { className: "bg-muted text-xs font-bold text-muted-foreground", children: user.name?.charAt(0) })]
                          }
                          )
                      }
                      )]
                  }
                  ) :

                  _jsx(Link, {
                    href: "/login", children:
                      _jsxs(Button, {
                        variant: "ghost", className: "text-sm text-muted-foreground hover:text-foreground hover:bg-muted gap-2", children: [
                          _jsx(LogIn, { className: "w-4 h-4" }),
                          _jsx("span", { className: "hidden md:inline", children: "Iniciar Sesi\xF3n" })]
                      }
                      )
                  }
                  )]
            }

            )]
        }
        ),

        _jsxs("main", {
          className: "w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-32 pb-20 md:py-32 space-y-12", children: [

            _jsxs("div", {
              className: "relative z-10 flex flex-col items-start gap-8 py-8 md:py-12 border-b border-border bg-card/50 backdrop-blur-sm rounded-md p-6 md:p-12 overflow-hidden ring-1 ring-border", children: [

                _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" }),

                _jsx("div", {
                  className: "relative flex flex-col md:flex-row justify-between items-end w-full gap-8", children:
                    _jsxs("div", {
                      className: "space-y-4 max-w-3xl", children: [

                        _jsxs("h1", {
                          className: "text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter leading-tight pt-4 pb-2 select-none", children: ["Operadores ",
                            _jsx("br", { className: "hidden md:block" }),
                            _jsx("span", { className: "bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/70 to-foreground/40", children: "en Turno" })]
                        }
                        ),

                        _jsx("p", { className: "text-muted-foreground text-lg md:text-xl font-medium tracking-wide max-w-lg leading-relaxed border-l-2 border-[#FF0C60]/20 pl-4", children: "Gesti\xF3n y monitoreo del personal operativo en tiempo real." }

                        )]
                    }
                    )
                }
                ),


                !loading && predictions.length > 0 &&
                _jsx("div", {
                  className: "flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide", children:
                    predictions.map((pred, idx) =>
                      _jsxs(motion.div, {

                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.2 + idx * 0.1 },
                        className: "bg-card/80 backdrop-blur-xl border border-border hover:border-[#FF0C60]/30 rounded-md p-3 md:p-4 flex items-center gap-3 min-w-[220px] group transition-all", children: [

                          _jsxs("div", {
                            className: "relative", children: [
                              _jsxs(Avatar, {
                                className: "w-8 h-8 md:w-10 md:h-10 border border-border", children: [
                                  _jsx(AvatarImage, { src: pred.nextOperator.avatar || pred.nextOperator.image }),
                                  _jsx(AvatarFallback, { className: "bg-muted text-xs font-bold text-muted-foreground", children: pred.nextOperator.name.charAt(0) })]
                              }
                              ),
                              pred.isReturning &&
                              _jsx("div", {
                                className: "absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center", children:
                                  _jsx("div", { className: "w-1.5 h-1.5 bg-white rounded-full animate-pulse" })
                              }
                              )]
                          }

                          ),
                          _jsxs("div", {
                            className: "flex-1 min-w-0", children: [
                              _jsx("div", { className: "text-xs font-semibold text-foreground truncate group-hover:text-[#FF0C60] transition-colors", children: pred.nextOperator.name }),
                              _jsx("div", {
                                className: "text-[10px] text-muted-foreground font-medium flex items-center gap-1.5", children:
                                  pred.timeUntil
                              }
                              )]
                          }
                          )]
                      }, pred.nextOperator.id
                      )
                    )
                }
                )]
            }

            ),


            loading ?
              _jsx("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children:
                  [1, 2, 3].map((i) => _jsx("div", { className: "h-48 bg-muted rounded-md animate-pulse" }, i))
              }
              ) :

              _jsx("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6", children:
                  operators.map((op, idx) =>
                    _jsx(motion.div, {

                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: idx * 0.05 }, children:

                        _jsxs(Card, {
                          className: `border-0 relative overflow-hidden h-full backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${op.isAvailable ? 'bg-card ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/10' : 'bg-card border border-border hover:border-[#FF0C60]/20'}`, children: [
                            _jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-20" }),

                            _jsxs(CardContent, {
                              className: "p-5 md:p-6 flex flex-col gap-5", children: [
                                _jsxs("div", {
                                  className: "flex items-center gap-4", children: [
                                    _jsxs("div", {
                                      className: "relative", children: [
                                        _jsxs(Avatar, {
                                          className: `w-14 h-14 md:w-16 md:h-16 border-2 ${op.isAvailable ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-border'}`, children: [
                                            _jsx(AvatarImage, { src: op.avatar || op.image }),
                                            _jsx(AvatarFallback, { className: "bg-muted text-lg font-bold text-muted-foreground", children: op.name.charAt(0) })]
                                        }
                                        ),
                                        _jsx("div", { className: `absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card ${op.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}` })]
                                    }
                                    ),

                                    _jsxs("div", {
                                      className: "flex-1 min-w-0", children: [
                                        _jsxs("div", {
                                          className: "flex items-center gap-2 mb-1", children: [
                                            _jsx("h3", { className: "text-lg md:text-xl font-bold truncate text-foreground", children: op.name }),
                                            op.role === 'BOSS' && _jsx(Shield, { className: "w-4 h-4 text-[#FF0C60]" })]
                                        }
                                        ),
                                        _jsx("div", {
                                          className: "inline-flex items-center px-3 py-1 rounded-full bg-muted/50 text-[10px] font-semibold tracking-tight text-muted-foreground border border-border", children:
                                            op.isAvailable ? _jsx("span", { className: "text-emerald-500 font-semibold", children: "En turno activo" }) : 'Fuera de turno'
                                        }
                                        )]
                                    }
                                    )]
                                }
                                ),


                                (() => {
                                  const activeEvent = getActiveEvent();
                                  if (activeEvent) {
                                    const endDate = new Date(activeEvent.endDate);

                                    const returnDateStr = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;

                                    return (
                                      _jsxs("div", {
                                        className: "bg-rose-500/5 border border-rose-500/20 rounded-md p-4 space-y-2 relative overflow-hidden group/event", children: [
                                          _jsxs("div", {
                                            className: "relative z-10", children: [
                                              _jsxs("div", {
                                                className: "flex items-center gap-2 text-xs font-semibold text-[#FF0C60] mb-1", children: [
                                                  _jsx(CalIcon, { className: "w-3.5 h-3.5" }),
                                                  _jsx("span", { children: "HORARIO ESPECIAL" })]
                                              }
                                              ),
                                              _jsx("div", {
                                                className: "text-sm font-semibold text-foreground", children:
                                                  activeEvent.name
                                              }
                                              ),
                                              _jsxs("div", {
                                                className: "text-[11px] text-muted-foreground mt-1 leading-tight italic", children: ["No se tiene un horario fijo. Revisar fecha que se vuelve: ",
                                                  _jsx("span", { className: "text-[#FF0C60] font-semibold not-italic", children: returnDateStr })]
                                              }
                                              )]
                                          }
                                          ),
                                          _jsx("div", {
                                            className: "absolute -right-2 -bottom-2 opacity-5 text-[#FF0C60] group-hover/event:scale-110 transition-transform", children:
                                              _jsx(CalIcon, { className: "w-16 h-16" })
                                          }
                                          )]
                                      }
                                      ));

                                  }

                                  if (op.isAvailable) {
                                    const activeStats = getCurrentShiftStats(op);
                                    if (activeStats) {
                                      const { progress, remaining, label } = activeStats;
                                      return (
                                        _jsx("div", {
                                          className: "bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4 space-y-2 relative overflow-hidden", children:
                                            _jsxs("div", {
                                              className: "relative z-10", children: [
                                                _jsxs("div", {
                                                  className: "flex justify-between text-xs font-semibold text-emerald-500", children: [
                                                    _jsx("span", { children: "Turno en Progreso" }),
                                                    _jsx("span", { className: "font-mono", children: remaining })]
                                                }
                                                ),
                                                _jsx("div", {
                                                  className: "h-1.5 bg-emerald-500/20 rounded-full overflow-hidden mt-2", children:
                                                    _jsx("div", { className: "h-full bg-emerald-500 transition-all duration-1000", style: { width: `${progress}%` } })
                                                }
                                                ),
                                                _jsx("div", { className: "text-[10px] text-emerald-500/60 text-right mt-1 font-mono", children: label })]
                                            }
                                            )
                                        }
                                        ));

                                    }
                                  }
                                  return null;
                                })(),


                                !getActiveEvent() &&
                                _jsxs("div", {
                                  className: "bg-muted/30 rounded-md p-4 space-y-3 border border-border", children: [
                                    _jsxs("div", {
                                      className: "flex justify-between items-center text-[10px] tracking-tight text-muted-foreground font-semibold", children: [
                                        _jsx("span", { children: "Horario semanal" }),
                                        op.isTempSchedule && _jsx(Badge, { variant: "outline", className: "text-[#FF0C60] border-[#FF0C60]/20 bg-[#FF0C60]/10 text-[9px] px-1 py-0 h-4 font-semibold", children: "MODIFICADO" })]
                                    }
                                    ),

                                    op.shifts && op.shifts.length > 0 ?
                                      _jsx("div", {
                                        className: "space-y-2", children:
                                          op.shifts.map((shift, sIdx) => {

                                            if (!shift.days || shift.days.length === 0) return null;

                                            const startOfWeekDate = new Date(currentRealWeek + 'T12:00:00');
                                            const todayDate = new Date();

                                            const formattedDateLabels = shift.days.map((d) => {
                                              const targetDate = new Date(startOfWeekDate);
                                              targetDate.setDate(startOfWeekDate.getDate() + d);
                                              const dayName = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][d];
                                              return `${dayName} ${targetDate.getDate()}`;
                                            }).join(', ');

                                            const isTodayReal = shift.days.some((d) => {
                                              const targetDate = new Date(startOfWeekDate);
                                              targetDate.setDate(startOfWeekDate.getDate() + d);
                                              return targetDate.toDateString() === todayDate.toDateString();
                                            });

                                            return (
                                              _jsxs("div", {
                                                className: `flex justify-between items-center text-sm group ${isTodayReal ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}`, children: [
                                                  _jsx("span", { className: "font-medium group-hover:text-foreground transition-colors", children: formattedDateLabels }),
                                                  _jsxs("span", {
                                                    className: `px-2 py-0.5 rounded text-xs font-mono font-semibold ${isTodayReal ? 'bg-card text-[#FF0C60] shadow-sm border border-[#FF0C60]/20' : 'bg-muted text-muted-foreground/40'}`, children: [
                                                      formatTime(shift.start), " - ", formatTime(shift.end)]
                                                  }
                                                  )]
                                              }, sIdx
                                              ));

                                          })
                                      }
                                      ) :

                                      _jsxs("div", {
                                        className: "flex items-center gap-2 text-xs text-muted-foreground italic py-1", children: [
                                          _jsx(Info, { className: "w-3.5 h-3.5" }),
                                          op.scheduleLabel || "Sin horario asignado"]
                                      }
                                      )]
                                }

                                )]
                            }

                            )]
                        }
                        )
                    }, op.id
                    )
                  )
              }
              )]
        }

        )]
    }
    ));

}