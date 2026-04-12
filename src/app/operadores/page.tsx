"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, Shield, Calendar, Info, Download, Home, Calendar as CalIcon, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { AllDayWidget } from "@/components/AllDayWidget";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Operator, Shift, UserRole } from "@/lib/types";
import { toast } from "sonner";

interface Prediction {
  nextOperator: Operator;
  timeUntil: string;
  shiftLabel: string;
  isReturning?: boolean;
}

interface SpecialEvent {
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function OperatorsPage() {
  const { user } = useAuth();

  const getInitialWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, "0");
    const d = String(sunday.getDate()).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };

  const [currentRealWeek] = useState(getInitialWeekStart());
  const [modalWeekStart, setModalWeekStart] = useState(getInitialWeekStart());
  const [operators, setOperators] = useState<Operator[]>([]);
  const [modalOperators, setModalOperators] = useState<Operator[]>([]);
  const [allUsers, setAllUsers] = useState<Operator[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksDuration, setWeeksDuration] = useState(4);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── helpers ──────────────────────────────────────────────────────────────

  const getDayRangeLabel = (days: number[]) => {
    if (!days || days.length === 0) return "";
    const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.length === 5 && sorted.join(",") === "1,2,3,4,5") return "Lun-Vie";
    if (sorted.length === 6 && sorted.join(",") === "1,2,3,4,5,6") return "Lun-Sab";
    if (sorted.length === 7) return "Todos los días";
    if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Fines de Sem";
    return sorted.map((d) => dayNames[d]).join(", ");
  };

  const formatTime = (hour: number) => {
    const ampm = hour >= 12 ? "pm" : "am";
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  const translateRole = (role: string | UserRole) => {
    switch (role) {
      case "OPERATOR": return "Operador";
      case "ENGINEER": return "Ingeniero";
      case "BOSS": return "Administrador";
      default: return role;
    }
  };

  const sortOperators = (data: Operator[]) =>
    data.sort((a, b) => {
      const aAvail = !!a.shifts?.some(s => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const end = s.end === 0 ? 24 : s.end;
        return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
      });
      const bAvail = !!b.shifts?.some(s => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const end = s.end === 0 ? 24 : s.end;
        return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
      });

      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      return 0;
    });

  // ─── data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/special-events");
        if (res.ok) setSpecialEvents(await res.json());
      } catch (e) {
        console.error("Error fetching special events:", e);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchMainOperators = async () => {
      try {
        const res = await fetch(`/api/users?weekStart=${currentRealWeek}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Error fetching main users");
        const data = await res.json();
        setOperators(sortOperators(data));
        calculatePredictions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) setAllUsers(await res.json());
      } catch (e) {
        console.error("Error fetching all users:", e);
      }
    };

    fetchAllUsers();
    fetchMainOperators();

    const timer = setInterval(() => {
      fetchMainOperators();
      fetchAllUsers();
    }, 60000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRealWeek]);

  useEffect(() => {
    const fetchModalOperators = async () => {
      setIsModalLoading(true);
      try {
        const res = await fetch(`/api/users?weekStart=${modalWeekStart}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Error fetching modal users");
        const data = await res.json();
        setModalOperators(sortOperators(data));
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setIsModalLoading(false), 300);
      }
    };
    fetchModalOperators();
  }, [modalWeekStart]);

  // ─── predictions ──────────────────────────────────────────────────────────

  const calculatePredictions = (ops: Operator[]) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const futureShifts: Array<{ op: Operator; hoursUntil: number; shift: Shift }> = [];

    ops.forEach((op) => {
      const isAvailable = op.shifts?.some(s => {
        const end = s.end === 0 ? 24 : s.end;
        return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
      });

      if (!op.shifts || isAvailable) return;
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
        } else if (daysUntil === -1) {
          daysUntil = nextDay - currentDay;
        }

        let totalHoursAway = daysUntil * 24 + (shift.start - currentHour);
        if (totalHoursAway < 0) totalHoursAway += 24 * 7;

        futureShifts.push({ op, hoursUntil: totalHoursAway, shift });
      });
    });

    futureShifts.sort((a, b) => a.hoursUntil - b.hoursUntil);

    const uniquePredictions: Prediction[] = [];
    const seenOps = new Set<string>();

    for (const item of futureShifts) {
      if (seenOps.has(item.op.id)) continue;
      if (uniquePredictions.length >= 2) break;
      seenOps.add(item.op.id);

      let timeLabel = "";
      if (item.hoursUntil < 1) timeLabel = "En menos de 1h";
      else if (item.hoursUntil < 24) timeLabel = `En ${Math.floor(item.hoursUntil)}h`;
      else timeLabel = `En ${Math.floor(item.hoursUntil / 24)}d ${Math.floor(item.hoursUntil % 24)}h`;

      uniquePredictions.push({
        nextOperator: item.op,
        timeUntil: timeLabel,
        shiftLabel: `${getDayRangeLabel(item.shift.days)} ${formatTime(item.shift.start)}-${formatTime(item.shift.end)}`,
      });
    }

    setPredictions(uniquePredictions);
  };

  // ─── shift stats ──────────────────────────────────────────────────────────

  const getCurrentShiftStats = (op: Operator) => {
    if (!op.shifts) return null;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    const activeShift = op.shifts.find((s) => {
      const end = s.end === 0 ? 24 : s.end;
      return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
    });

    if (!activeShift) return null;

    const end = activeShift.end === 0 ? 24 : activeShift.end;
    const elapsed = currentHour - activeShift.start;
    const duration = end - activeShift.start;
    const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
    const remainingHours = end - currentHour;
    const remainingH = Math.floor(remainingHours);
    const remainingM = Math.round((remainingHours - remainingH) * 60);

    return {
      progress,
      remaining: `${remainingH}h ${remainingM}m`,
      label: `${formatTime(activeShift.start)} - ${formatTime(activeShift.end)}`,
    };
  };

  const getActiveEvent = () => {
    if (!specialEvents || specialEvents.length === 0) return null;
    const now = new Date();
    return specialEvents.find((e) => {
      if (!e.isActive) return false;
      return now >= new Date(e.startDate) && now <= new Date(e.endDate);
    });
  };

  // ─── calendar subscribe ───────────────────────────────────────────────────

  const handleSubscribe = (mode: boolean | 'copy') => {
    const operatorId = user?.id;
    console.log("HandleSubscribe context:", { operatorId, mode, user });
    
    if (!operatorId) {
      toast.error("No se pudo identificar tu sesión de usuario", {
        description: "Por favor, intenta cerrar sesión e iniciarla de nuevo."
      });
      return;
    }

    let baseUrl = `${window.location.origin}/api/calendar/${operatorId}?weeks=${weeksDuration}`;
    if (baseUrl.includes("0.0.0.0")) baseUrl = baseUrl.replace("0.0.0.0", "localhost");

    if (mode === true) {
      // Protocol subscribe
      window.location.href = baseUrl.replace(/^https?:/, "webcal:");
      toast.info("Abriendo aplicación de calendario...", {
        description: "Si no sucede nada, intenta usar la opción de copiar enlace."
      });
    } else if (mode === false) {
      // Direct ICS download
      window.open(baseUrl, "_blank");
      toast.success("Descargando archivo de calendario");
    } else if (mode === 'copy') {
      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(baseUrl)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("¡Enlace copiado correctamente!", {
              description: "Ya puedes pegarlo en la sección 'Añadir por URL' de Google Calendar."
            });
          })
          .catch(err => {
            console.error("Clipboard error:", err);
            prompt("No se pudo copiar automáticamente. Copia este enlace manualmente:", baseUrl);
          });
      } else {
        prompt("Tu navegador no soporta copiado automático. Copia este enlace manualmente:", baseUrl);
      }
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-foreground selection:bg-[#FF0C60] selection:text-white">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-6 py-3 flex justify-between items-center bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-semibold text-base tracking-tight hidden md:block text-foreground">
              Control Master
              </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-card text-muted-foreground hover:text-[#FF0C60] hover:bg-rose-500/10 rounded-md h-9 w-9"
            >
              <Home className="w-4 h-4" />
            </Button>
          </Link>

          {/* Calendar modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted gap-2 backdrop-blur-md"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Ver Calendario</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full h-full md:h-[95vh] md:max-w-[98vw] bg-card backdrop-blur-xl border-border text-card-foreground p-0 overflow-hidden shadow-none ring-1 ring-border flex flex-col rounded-none md:rounded-xl duration-500 data-[state=open]:duration-500 data-[state=closed]:duration-500 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                    Distribución Semanal
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    Vista global de turnos de todos los operadores.
                  </DialogDescription>
                </div>

                {user && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        className="bg-muted/50 border border-border text-foreground text-xs rounded-md px-2 py-2 outline-none focus:border-ring appearance-none pr-8 cursor-pointer"
                        value={weeksDuration}
                        onChange={(e) => setWeeksDuration(Number(e.target.value))}
                      >
                        <option value={4}>4 Semanas</option>
                        <option value={8}>8 Semanas</option>
                        <option value={12}>3 Meses</option>
                        <option value={24}>6 Meses</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                        <Calendar className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="flex bg-muted/50 rounded-md border border-border p-0.5">
                      <Button
                        onClick={() => handleSubscribe(true)}
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all rounded-r-none"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Suscribir
                      </Button>
                      <div className="w-px bg-slate-200 my-1" />
                      <Button
                        onClick={() => (handleSubscribe as any)('copy')}
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-700'}`}
                        title="Copiar Enlace para Google Calendar"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <div className="w-px bg-slate-200 my-1" />
                      <Button
                        onClick={() => handleSubscribe(false)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-l-none"
                        title="Descargar Archivo .ics"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-0 md:p-6 flex-1 flex flex-col overflow-hidden">
                <WeeklyCalendar
                  operators={modalOperators}
                  currentWeekStart={modalWeekStart}
                  onWeekChange={setModalWeekStart}
                  isLoading={isModalLoading}
                />
              </div>
            </DialogContent>
          </Dialog>

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-[10px] text-muted-foreground tracking-wide">{translateRole(user.role)}</div>
              </div>
              <Link href="/">
                <Avatar className="w-8 h-8 border border-border cursor-pointer hover:border-[#FF0C60] transition-all">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                    {user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden md:inline">Iniciar Sesión</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-24 pb-20 md:pt-32 md:pb-12 space-y-10">

        <div className="relative z-10 flex flex-col items-start gap-4 py-8 md:py-12 border-b border-border bg-card/50 backdrop-blur-sm rounded-md px-6 md:px-10 overflow-hidden ring-1 ring-border">
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col md:flex-row justify-between items-end w-full gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.1] pt-1 select-none">
                Operadores{" "}
                <br className="hidden md:block" />
                <span className="text-foreground/60">
                  en Turno
                </span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg tracking-tight max-w-lg leading-relaxed border-l-2 border-[#FF0C60]/20 pl-4">
                Gestión y monitoreo del personal operativo en tiempo real.
              </p>
            </div>
          </div>

          {!loading && predictions.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto scrollbar-hide">
              {predictions.map((pred, idx) => (
                <motion.div
                  key={pred.nextOperator.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="bg-card/80 backdrop-blur-xl border border-border hover:border-[#FF0C60]/30 rounded-md p-3 flex items-center gap-3 min-w-[200px] group transition-all"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={pred.nextOperator.image} />
                      <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                        {pred.nextOperator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {pred.isReturning && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate group-hover:text-[#FF0C60] transition-colors">
                      {pred.nextOperator.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      {pred.timeUntil}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start relative z-10">

          <div className="lg:col-span-1 lg:sticky lg:top-24 z-20">
            <AllDayWidget operators={operators} specialEvents={specialEvents} />
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {operators.map((op, idx) => {
                  const activeEvent = getActiveEvent();
                  const now = new Date();
                  const currentDay = now.getDay();
                  const currentHour = now.getHours() + now.getMinutes() / 60;
                  const isAvailable = !!op.shifts?.some(s => {
                    const end = s.end === 0 ? 24 : s.end;
                    return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
                  });
                  const activeStats = isAvailable ? getCurrentShiftStats(op) : null;

                  return (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className={`border-0 relative overflow-hidden h-full backdrop-blur-xl transition-all duration-300 hover:scale-[1.015] ${isAvailable ? "bg-card ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/10" : "bg-card border border-border hover:border-[#FF0C60]/20"}`}>
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                        <CardContent className="p-5 flex flex-col gap-4">

                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <Avatar className={`w-12 h-12 border-2 ${isAvailable ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-border"}`}>
                                <AvatarImage src={op.image} />
                                <AvatarFallback className="bg-muted text-base font-medium text-muted-foreground">
                                  {op.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-base font-semibold truncate text-foreground">{op.name}</h3>
                                {op.role === "BOSS" && <Shield className="w-3.5 h-3.5 text-[#FF0C60] shrink-0" />}
                              </div>
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted/60 text-[10px] tracking-tight text-muted-foreground border border-border">
                                {isAvailable
                                  ? <span className="text-emerald-500">En turno activo</span>
                                  : "Fuera de turno"
                                }
                              </div>
                            </div>
                          </div>

                          {activeEvent && (() => {
                            const endDate = new Date(activeEvent.endDate);
                            const returnDateStr = `${endDate.getDate().toString().padStart(2, "0")}/${(endDate.getMonth() + 1).toString().padStart(2, "0")}`;
                            return (
                              <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-3 space-y-1 relative overflow-hidden group/event">
                                <div className="flex items-center gap-2 text-[10px] font-medium text-[#FF0C60] uppercase tracking-wide">
                                  <CalIcon className="w-3.5 h-3.5" />
                                  Horario especial
                                </div>
                                <div className="text-sm font-medium text-foreground">{activeEvent.name}</div>
                                <div className="text-[11px] text-muted-foreground leading-tight italic">
                                  Sin horario fijo. Retorno:{" "}
                                  <span className="text-[#FF0C60] not-italic font-medium">{returnDateStr}</span>
                                </div>
                                <div className="absolute -right-2 -bottom-2 opacity-5 text-[#FF0C60] group-hover/event:scale-110 transition-transform">
                                  <CalIcon className="w-14 h-14" />
                                </div>
                              </div>
                            );
                          })()}

                          {!activeEvent && activeStats && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-3 space-y-2">
                              <div className="flex justify-between text-xs text-emerald-500">
                                <span>Turno en progreso</span>
                                <span className="font-mono">{activeStats.remaining}</span>
                              </div>
                              <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-1000"
                                  style={{ width: `${activeStats.progress}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-emerald-500/60 text-right font-mono">{activeStats.label}</div>
                            </div>
                          )}

                          {!activeEvent && (
                            <div className="bg-muted/30 rounded-md p-3 space-y-2 border border-border">
                              <div className="flex justify-between items-center text-[10px] tracking-wide text-muted-foreground uppercase">
                                <span>Horario semanal</span>
                                {op.isTempSchedule && (
                                  <Badge variant="outline" className="text-[#FF0C60] border-[#FF0C60]/20 bg-[#FF0C60]/10 text-[9px] px-1.5 py-0 h-4">
                                    MODIFICADO
                                  </Badge>
                                )}
                              </div>

                              {op.shifts && op.shifts.length > 0 ? (
                                <div className="space-y-1.5">
                                  {op.shifts.map((shift, sIdx) => {
                                    if (!shift.days || shift.days.length === 0) return null;
                                    const startOfWeekDate = new Date(currentRealWeek + "T12:00:00");
                                    const todayDate = new Date();

                                    const formattedDateLabels = shift.days
                                      .map((d) => {
                                        const target = new Date(startOfWeekDate);
                                        target.setDate(startOfWeekDate.getDate() + d);
                                        const dayName = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][d];
                                        return `${dayName} ${target.getDate()}`;
                                      })
                                      .join(", ");

                                    const isTodayReal = shift.days.some((d) => {
                                      const target = new Date(startOfWeekDate);
                                      target.setDate(startOfWeekDate.getDate() + d);
                                      return target.toDateString() === todayDate.toDateString();
                                    });

                                    return (
                                      <div
                                        key={sIdx}
                                        className={`flex justify-between items-center text-sm ${isTodayReal ? "text-foreground" : "text-muted-foreground/50"}`}
                                      >
                                        <span className={isTodayReal ? "font-medium" : "font-normal"}>
                                          {formattedDateLabels}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${isTodayReal ? "bg-card text-[#FF0C60] shadow-sm border border-[#FF0C60]/20" : "bg-muted text-muted-foreground/40"}`}>
                                          {formatTime(shift.start)} – {formatTime(shift.end)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-0.5">
                                  <Info className="w-3.5 h-3.5 shrink-0" />
                                  {"Sin horario asignado"}
                                </div>
                              )}
                            </div>
                          )}

                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}