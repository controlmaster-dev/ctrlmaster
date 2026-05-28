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
import { OperadoresPageSkeleton } from "@/components/skeletons/OperadoresPageSkeleton";
import { pageHeaderBarClass, pageMainClass } from "@/lib/page-layout";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { useOperadoresBundle, useOperadoresWeek } from "@/hooks/useOperadoresBundle";
import { Navbar } from "@/components/Navbar";
import { BentoCard } from "@/components/dashboard/BentoCard";

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

  const [currentRealWeek] = useState(getSundayWeekStart);
  const [modalWeekStart, setModalWeekStart] = useState(getSundayWeekStart);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [weeksDuration, setWeeksDuration] = useState(4);
  const [copied, setCopied] = useState(false);

  const { operators, specialEvents, isReady } = useOperadoresBundle(currentRealWeek);
  const { operators: modalOperators, isReady: modalReady } =
    useOperadoresWeek(modalWeekStart);
  const eventsList = specialEvents as SpecialEvent[];

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

  useEffect(() => {
    if (operators.length > 0) {
      calculatePredictions(operators);
    } else {
      setPredictions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operators]);

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
    if (!eventsList.length) return null;
    const now = new Date();
    return (
      eventsList.find((e) => {
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

  const onDutyCount = operators.filter((op) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return !!op.shifts?.some((s) => {
      const end = s.end === 0 ? 24 : s.end;
      return (
        s.days.includes(currentDay) &&
        currentHour >= s.start &&
        currentHour < end
      );
    });
  }).length;

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="operadores-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <Navbar />
 
      <main className={pageMainClass}>
        {!isReady ? (
          <OperadoresPageSkeleton />
        ) : (
        <div className="space-y-5">
        <BentoCard variant="default" className="overflow-hidden">
          <div className="border-b border-border px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Equipo de control
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                    Horarios de operadores
                  </h1>
                  
                  {/* Calendar Dialog Trigger placed contextually next to the title */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 rounded-[6px] border-border bg-muted/20 hover:bg-muted/40 text-xs font-semibold"
                      >
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Distribución semanal</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="operadores-ui flex h-full w-full max-w-[98vw] flex-col overflow-hidden border-border bg-card p-0 md:h-[95vh] md:rounded-[6px]">
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
                              className="h-9 rounded-[6px] border border-border bg-card px-3 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer hover:bg-muted/20"
                              value={weeksDuration}
                              onChange={(e) => setWeeksDuration(Number(e.target.value))}
                            >
                              <option value={4}>4 semanas</option>
                              <option value={8}>8 semanas</option>
                              <option value={12}>3 meses</option>
                              <option value={24}>6 meses</option>
                            </select>
 
                            <div className="flex rounded-[6px] border border-border bg-muted/20 p-0.5">
                              <Button
                                onClick={() => handleSubscribe(true)}
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 rounded-[4px] text-xs font-semibold hover:bg-card hover:shadow-none"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                Suscribir
                              </Button>
                              <Button
                                onClick={() => (handleSubscribe as unknown as (m: string) => void)("copy")}
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-[4px] hover:bg-card hover:shadow-none ${copied ? "text-emerald-500" : "text-muted-foreground"}`}
                                title="Copiar enlace"
                              >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                onClick={() => handleSubscribe(false)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-[4px] hover:bg-card hover:shadow-none text-muted-foreground"
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
                          isLoading={!modalReady}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Estado en vivo de los trabajadores de Control Máster.
                </p>
              </div>
 
              {operators.length > 0 && (
                <div className="flex shrink-0 border border-border bg-muted/20 rounded-[6px] overflow-hidden text-center text-xs shadow-none">
                  <div className="min-w-[5.5rem] px-4 py-2.5 bg-card flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                        {onDutyCount}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">En turno</p>
                  </div>
                  <div className="min-w-[5.5rem] border-l border-border px-4 py-2.5 bg-card flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                        {operators.length - onDutyCount}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Fuera</p>
                  </div>
                  <div className="min-w-[5.5rem] border-l border-border px-4 py-2.5 bg-card flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
                      <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                        {operators.length}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Total</p>
                  </div>
                </div>
              )}
            </div>
          </div>
 
          {predictions.length > 0 && (
            <div className="px-4 py-3 md:px-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Próximos en turno
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {predictions.map((pred) => (
                  <div
                    key={pred.nextOperator.id}
                    className="flex items-center gap-3 bg-muted/10 border border-border rounded-[6px] px-3 py-2.5"
                  >
                    <Avatar className="h-8 w-8 rounded-[6px] border border-border">
                      <AvatarImage src={pred.nextOperator.image} className="rounded-[6px]" />
                      <AvatarFallback className="rounded-[6px] text-xs font-bold bg-muted">
                        {pred.nextOperator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pred.nextOperator.name}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {pred.timeUntil}
                        <span className="mx-1.5 text-border">·</span>
                        {pred.shiftLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </BentoCard>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-4 lg:gap-6">
          <div className="lg:col-span-1 lg:sticky lg:top-[4.5rem]">
            <AllDayWidget operators={operators} specialEvents={eventsList} />
          </div>

          <div className="lg:col-span-3">
            {operators.length === 0 ? (
              <div className="border border-dashed border-border/60 bg-muted/10 py-16 text-center">
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
        </div>
        )}
      </main>
    </div>
  );
}