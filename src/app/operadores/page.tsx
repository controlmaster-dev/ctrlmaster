"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
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
import {
  countOperatorsOnDuty,
  formatHoursUntilLabel,
  getActiveShiftProgress,
  getCurrentDayIndex,
  getCurrentHourDecimal,
  getHoursUntilNextShift,
  getNextOperatorId,
  getWeeklySchemeShifts,
  isOperatorActiveNow,
} from "@/lib/operadorSchedule";
import { useScheduleClock } from "@/hooks/useScheduleClock";
import {
  sortOperators,
  useOperadoresBundle,
  useOperadoresWeek,
} from "@/hooks/useOperadoresBundle";
import { cn } from "@/lib/utils";
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

  const scheduleTick = useScheduleClock();
  const { operators, specialEvents, isReady } = useOperadoresBundle(currentRealWeek);
  const todayIdx = getCurrentDayIndex();
  const currentHour = getCurrentHourDecimal();
  const nextOperatorId = useMemo(
    () => getNextOperatorId(operators, todayIdx, currentHour),
    [operators, todayIdx, currentHour, scheduleTick]
  );
  const onDutyCount = useMemo(
    () => countOperatorsOnDuty(operators, todayIdx, currentHour),
    [operators, todayIdx, currentHour, scheduleTick]
  );
  const displayedOperators = useMemo(
    () => sortOperators(operators),
    [operators, scheduleTick]
  );
  const { operators: modalOperators, isReady: modalReady } =
    useOperadoresWeek(modalWeekStart);
  const eventsList = specialEvents as SpecialEvent[];


  const getDayRangeLabel = useCallback((days: number[]) => {
    if (!days || days.length === 0) return "";
    const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.length === 5 && sorted.join(",") === "1,2,3,4,5") return "Lun-Vie";
    if (sorted.length === 6 && sorted.join(",") === "1,2,3,4,5,6") return "Lun-Sab";
    if (sorted.length === 7) return "Todos los días";
    if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Fines de Sem";
    return sorted.map((d) => dayNames[d]).join(", ");
  }, []);

  const formatTime = useCallback((hour: number) => {
    const ampm = hour >= 12 ? "pm" : "am";
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  }, []);


  const calculatePredictions = useCallback(
    (ops: Operator[], crTodayIdx: number, crCurrentHour: number) => {
      const futureShifts: Array<{ op: Operator; hoursUntil: number; shift: Shift }> = [];

      ops.forEach((op) => {
        const shifts = getWeeklySchemeShifts(op);
        const hoursUntil = getHoursUntilNextShift(shifts, crTodayIdx, crCurrentHour);
        if (hoursUntil === null || hoursUntil <= 0) return;

        const dayShifts = shifts?.filter((s) => s.days.includes(crTodayIdx)) ?? [];
        const shift =
          dayShifts.find((s) => crCurrentHour < s.start) ??
          shifts?.find((s) => s.days.some((d) => d > crTodayIdx)) ??
          shifts?.[0];
        if (!shift) return;

        futureShifts.push({ op, hoursUntil, shift });
      });

      futureShifts.sort((a, b) => a.hoursUntil - b.hoursUntil);

      const uniquePredictions: Prediction[] = [];
      const seenOps = new Set<string>();

      for (const item of futureShifts) {
        if (seenOps.has(item.op.id)) continue;
        if (uniquePredictions.length >= 2) break;
        seenOps.add(item.op.id);

        uniquePredictions.push({
          nextOperator: item.op,
          timeUntil: formatHoursUntilLabel(item.hoursUntil),
          shiftLabel: `${getDayRangeLabel(item.shift.days)} ${formatTime(item.shift.start)}-${formatTime(item.shift.end)}`,
        });
      }

      setPredictions(uniquePredictions);
    },
    [formatTime, getDayRangeLabel]
  );

  useEffect(() => {
    if (operators.length > 0) {
      calculatePredictions(operators, todayIdx, currentHour);
    } else {
      setPredictions([]);
    }
  }, [operators, calculatePredictions, scheduleTick, todayIdx, currentHour]);

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


  const handleSubscribe = async (mode: boolean | 'copy') => {
    const operatorId = user?.id;

    if (!operatorId) {
      toast.error("No se pudo identificar tu sesión de usuario", {
        description: "Por favor, intenta cerrar sesión e iniciarla de nuevo."
      });
      return;
    }

    let feedToken: string;
    try {
      const tokenRes = await fetch("/api/calendar/token", { credentials: "include" });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error || "No se pudo obtener el enlace del calendario");
      }
      feedToken = tokenData.token as string;
    } catch (err) {
      toast.error("Enlace de calendario no disponible", {
        description: err instanceof Error ? err.message : "Inicia sesión e intenta de nuevo.",
      });
      return;
    }

    const params = new URLSearchParams({
      weeks: String(weeksDuration),
      token: feedToken,
    });
    let baseUrl = `${window.location.origin}/api/calendar/${operatorId}?${params.toString()}`;
    if (baseUrl.includes("0.0.0.0")) baseUrl = baseUrl.replace("0.0.0.0", "localhost");

    if (mode === true) {

      window.location.href = baseUrl.replace(/^https?:/, "webcal:");
      toast.info("Abriendo aplicación de calendario...", {
        description: "Si no sucede nada, intenta usar la opción de copiar enlace."
      });
    } else if (mode === false) {

      window.open(baseUrl, "_blank");
      toast.success("Descargando archivo de calendario");
    } else if (mode === 'copy') {

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

  return (
    <div className="operadores-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-brand selection:text-white">
      <Navbar />

      <main className={pageMainClass}>
        {!isReady ? (
          <OperadoresPageSkeleton />
        ) : (
        <div className="space-y-5">
        <BentoCard variant="default" className="overflow-hidden">
          <div className="border-b border-border px-4 py-5 md:px-6 md:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Equipo de control
                </p>
                <h1 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">
                  Horarios de operadores
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Estado en vivo de los trabajadores de Control Máster.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 sm:max-w-md lg:w-auto lg:max-w-none lg:shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover lg:min-w-[260px]"
                    >
                      <Calendar className="h-5 w-5 shrink-0" aria-hidden />
                      Ver distribución semanal
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

                            <div className="flex items-center gap-1.5">
                              <Button
                                onClick={() => handleSubscribe(true)}
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 rounded-md border-border text-xs font-medium shadow-none hover:bg-muted/30"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                Suscribir
                              </Button>
                              <Button
                                onClick={() => (handleSubscribe as unknown as (m: string) => void)("copy")}
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-9 w-9 rounded-md border-border shadow-none hover:bg-muted/30",
                                  copied ? "text-emerald-600" : "text-muted-foreground"
                                )}
                                title="Copiar enlace"
                              >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                onClick={() => handleSubscribe(false)}
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-md border-border text-muted-foreground shadow-none hover:bg-muted/30"
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

                {operators.length > 0 && (
                  <div className="flex w-full border border-border bg-muted/20 rounded-lg overflow-hidden text-center text-xs shadow-sm">
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
            {displayedOperators.length === 0 ? (
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
                {displayedOperators.map((op) => {
                  const schemeShifts = getWeeklySchemeShifts(op);
                  const hoursUntilNext = getHoursUntilNextShift(
                    schemeShifts,
                    todayIdx,
                    currentHour
                  );
                  const isAvailable = isOperatorActiveNow(
                    schemeShifts,
                    todayIdx,
                    currentHour
                  );

                  return (
                    <OperatorCard
                      key={op.id}
                      operator={op}
                      isAvailable={isAvailable}
                      activeStats={
                        isAvailable
                          ? getActiveShiftProgress(
                              schemeShifts,
                              formatTime,
                              todayIdx,
                              currentHour
                            )
                          : null
                      }
                      activeEvent={activeEvent}
                      currentWeekStart={currentRealWeek}
                      formatTime={formatTime}
                      isNextInQueue={nextOperatorId === op.id}
                      hoursUntilNext={hoursUntilNext}
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
