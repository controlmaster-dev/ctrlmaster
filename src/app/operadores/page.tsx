"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  Calendar,
  Download,
  Home,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { AllDayWidget } from "@/components/AllDayWidget";
import { OperatorCard } from "@/components/operadores/OperatorCard";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Operator, Shift } from "@/lib/types";
import { toast } from "sonner";
import { OperadoresCardsSkeleton } from "@/components/skeletons/OperadoresCardsSkeleton";

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

  const getActiveEvent = (): SpecialEvent | null => {
    if (!specialEvents || specialEvents.length === 0) return null;
    const now = new Date();
    return (
      specialEvents.find((e) => {
        if (!e.isActive) return false;
        return now >= new Date(e.startDate) && now <= new Date(e.endDate);
      }) ?? null
    );
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

  const activeEvent = getActiveEvent();

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#FF0C60]/6 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="h-0.5 bg-[#FF0C60]" aria-hidden />
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90">
            <Image
              src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
              alt="Control Master"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              Control Master
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-border/80"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-lg border-border/80 bg-card/80"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden md:inline">Calendario</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="flex h-full w-full max-w-[98vw] flex-col overflow-hidden rounded-none border-border bg-card p-0 md:h-[95vh] md:rounded-xl">
                <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <DialogTitle className="text-lg font-semibold">
                      Distribución semanal
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Turnos de todos los operadores
                    </DialogDescription>
                  </div>

                  {user && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#FF0C60]"
                        value={weeksDuration}
                        onChange={(e) => setWeeksDuration(Number(e.target.value))}
                      >
                        <option value={4}>4 semanas</option>
                        <option value={8}>8 semanas</option>
                        <option value={12}>3 meses</option>
                        <option value={24}>6 meses</option>
                      </select>

                      <div className="flex rounded-lg border border-border/60 bg-muted/25 p-0.5">
                        <Button
                          onClick={() => handleSubscribe(true)}
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 rounded-md text-xs"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Suscribir
                        </Button>
                        <Button
                          onClick={() => (handleSubscribe as unknown as (m: string) => void)("copy")}
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-md ${copied ? "text-emerald-600" : ""}`}
                          title="Copiar enlace"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          onClick={() => handleSubscribe(false)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          title="Descargar .ics"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col overflow-hidden p-0 md:p-6">
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
              <Link href="/" className="ml-1 hidden border-l border-border pl-3 sm:block">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-9 gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-8">
        <header className="space-y-5 border-b border-border/60 pb-6">
          <div>
            <p className="text-sm text-muted-foreground">Equipo de control</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Horarios de <span className="text-[#FF0C60]">operadores</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Quién está en turno ahora y la programación de la semana.
            </p>
          </div>

          {!loading && predictions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Próximos en turno
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {predictions.map((pred) => (
                  <div
                    key={pred.nextOperator.id}
                    className="flex min-w-[180px] shrink-0 items-center gap-2.5 rounded-lg border border-border/60 bg-card/80 px-3 py-2"
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={pred.nextOperator.image} />
                      <AvatarFallback className="text-xs">
                        {pred.nextOperator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {pred.nextOperator.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {pred.timeUntil}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <AllDayWidget operators={operators} specialEvents={specialEvents} />
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <OperadoresCardsSkeleton />
            ) : operators.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
                <p className="text-sm font-medium text-foreground">
                  No hay operadores configurados
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Revisa la configuración de horarios en el panel de administración.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {operators.map((op) => {
                  const now = new Date();
                  const currentDay = now.getDay();
                  const currentHour = now.getHours() + now.getMinutes() / 60;
                  const isAvailable = !!op.shifts?.some((s) => {
                    const end = s.end === 0 ? 24 : s.end;
                    return (
                      s.days.includes(currentDay) &&
                      currentHour >= s.start &&
                      currentHour < end
                    );
                  });

                  return (
                    <OperatorCard
                      key={op.id}
                      operator={op}
                      isAvailable={isAvailable}
                      activeStats={isAvailable ? getCurrentShiftStats(op) : null}
                      activeEvent={activeEvent}
                      currentWeekStart={currentRealWeek}
                      formatTime={formatTime}
                    />
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