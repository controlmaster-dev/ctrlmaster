"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, Calendar as CalIcon } from "lucide-react";
import type { Operator } from "@/lib/types";
import {
  formatShiftRange,
  getCurrentDayIndex,
  getCurrentHourDecimal,
  getTodayShiftCellStatus,
  getWeeklySchemeShifts,
  isDayOff,
  shiftsForDayOfWeek,
  WEEK_COLUMNS_MONDAY_FIRST,
} from "@/lib/operadorSchedule";
import { cn } from "@/lib/utils";

interface ShiftStats {
  progress: number;
  remaining: string;
  label: string;
}

interface SpecialEvent {
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface OperatorCardProps {
  operator: Operator;
  isAvailable: boolean;
  activeStats: ShiftStats | null;
  activeEvent: SpecialEvent | null;
  currentWeekStart: string;
  formatTime: (hour: number) => string;
  /** Próximo en entrar según cola de turnos */
  isNextInQueue?: boolean;
  hoursUntilNext?: number | null;
}

export function OperatorCard({
  operator: op,
  isAvailable,
  activeStats,
  activeEvent,
  formatTime,
  isNextInQueue = false,
  hoursUntilNext = null,
}: OperatorCardProps) {
  const todayIdx = getCurrentDayIndex();
  const currentHour = getCurrentHourDecimal();
  const schemeShifts = getWeeklySchemeShifts(op);

  const returnDateStr = activeEvent
    ? (() => {
        const endDate = new Date(activeEvent.endDate);
        return `${endDate.getDate().toString().padStart(2, "0")}/${(endDate.getMonth() + 1).toString().padStart(2, "0")}`;
      })()
    : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col border rounded-lg bg-card transition-all duration-300 hover:border-foreground/15 dark:hover:border-foreground/20",
        isAvailable &&
          "border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02]",
        isNextInQueue &&
          !isAvailable &&
          "border-violet-500/45 bg-violet-500/[0.04] ring-1 ring-violet-500/25 dark:border-violet-400/40 dark:bg-violet-500/[0.06]",
        !isAvailable && !isNextInQueue && "border-border"
      )}
    >
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-lg border border-border relative overflow-visible">
            <AvatarImage src={op.image} className="rounded-lg" />
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {op.name.charAt(0)}
            </AvatarFallback>
            {isAvailable && (
              <>
                <span className="absolute -inset-0.5 rounded-lg ring-2 ring-emerald-500/30 dark:ring-emerald-400/20 animate-pulse pointer-events-none" />
                <span className="absolute -inset-1.5 rounded-xl ring-1 ring-emerald-500/10 dark:ring-emerald-400/10 animate-ping pointer-events-none" />
              </>
            )}
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-card shadow-sm z-10",
              isAvailable ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {op.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isAvailable ? (
              <span className="text-foreground/90 font-medium flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                En turno ahora
              </span>
            ) : isNextInQueue ? (
              <span className="font-medium text-violet-700 dark:text-violet-300">
                Próximo en entrar
                {hoursUntilNext != null && hoursUntilNext > 0 && (
                  <span className="text-violet-600/80 dark:text-violet-400/90">
                    {" "}
                    ·{" "}
                    {hoursUntilNext < 1
                      ? "menos de 1h"
                      : `en ${Math.floor(hoursUntilNext)}h`}
                  </span>
                )}
              </span>
            ) : (
              "Fuera de turno"
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        {activeEvent && returnDateStr ? (
          <div className="border-l-4 border-l-amber-500 border border-border bg-amber-500/[0.02] dark:bg-amber-500/[0.03] rounded-lg px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <CalIcon className="h-3.5 w-3.5 animate-pulse" />
              Horario especial
            </p>
            <p className="mt-1.5 text-sm font-bold text-foreground leading-snug">
              {activeEvent.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Retorno estimado:{" "}
              <span className="font-bold text-foreground">{returnDateStr}</span>
            </p>
          </div>
        ) : null}

        {!activeEvent && activeStats ? (
          <div className="space-y-2 border border-border bg-muted/15 rounded-lg p-3.5">
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Turno en curso
              </span>
              <span className="font-mono tabular-nums text-foreground">
                {activeStats.remaining}
              </span>
            </div>
            <div className="h-2 overflow-hidden bg-muted border border-border rounded-full relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${activeStats.progress}%` }}
              >
                <span className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-right font-mono text-[9px] text-muted-foreground font-medium">
              {activeStats.label}
            </p>
          </div>
        ) : null}

        {!activeEvent ? (
          <div className="flex-1 flex flex-col gap-2.5 border border-border bg-muted/10 rounded-lg p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Esquema semanal
              </span>
              {op.isTempSchedule && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-md border-border bg-background px-1.5 text-[9px] font-semibold text-muted-foreground shadow-none"
                >
                  Modificado
                </Badge>
              )}
            </div>

            {schemeShifts && schemeShifts.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1.5 select-none">
                  {WEEK_COLUMNS_MONDAY_FIRST.map(({ label: dayLabel, dayIdx, name: dayName }) => {
                    const dayShifts = shiftsForDayOfWeek(schemeShifts, dayIdx);
                    const isOff = isDayOff(schemeShifts, dayIdx);
                    const todayStatus = getTodayShiftCellStatus(
                      schemeShifts,
                      dayIdx,
                      todayIdx,
                      currentHour
                    );
                    const isActiveToday = todayStatus === "active";
                    const isEndedToday = todayStatus === "ended";
                    const isUpcomingToday = todayStatus === "upcoming";
                    const isWorkDay = !isOff;

                    const rangesLabel = isOff
                      ? "Libre"
                      : dayShifts.map((s) => formatShiftRange(s, formatTime)).join(", ");

                    const titleSuffix =
                      todayStatus === "active"
                        ? " (hoy, en turno)"
                        : todayStatus === "ended"
                          ? " (hoy, turno finalizado)"
                          : todayStatus === "upcoming"
                            ? " (hoy, turno pendiente)"
                            : "";

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 transition-all duration-200",
                          isOff &&
                            "border border-dashed border-muted-foreground/25 bg-muted/70 dark:bg-black/35 opacity-75",
                          isActiveToday &&
                            "border-2 border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/10 dark:bg-emerald-500/25",
                          isEndedToday &&
                            "border border-amber-500/35 bg-card shadow-sm dark:bg-background/95",
                          isUpcomingToday &&
                            (isNextInQueue
                              ? "border-2 border-violet-500/50 bg-violet-500/15 shadow-sm shadow-violet-500/10 dark:bg-violet-500/20"
                              : "border border-violet-400/25 bg-card shadow-sm dark:bg-background/95"),
                          isWorkDay &&
                            todayStatus === "not-today" &&
                            "border border-foreground/20 bg-card shadow-sm dark:border-foreground/25 dark:bg-background/95"
                        )}
                        title={`${dayName}: ${rangesLabel}${titleSuffix}`}
                      >
                        <span
                          className={cn(
                            "text-[9px] font-bold leading-none",
                            isOff && "text-muted-foreground/60",
                            isActiveToday && "text-emerald-800 dark:text-emerald-200",
                            isEndedToday && "text-foreground",
                            (isUpcomingToday || (isWorkDay && todayStatus === "not-today")) &&
                              "text-foreground"
                          )}
                        >
                          {dayLabel}
                        </span>

                        {isActiveToday && (
                          <span className="rounded bg-emerald-600/90 px-1 py-px text-[6px] font-bold uppercase leading-none text-white">
                            Hoy
                          </span>
                        )}

                        {isEndedToday && (
                          <span className="max-w-full px-0.5 text-center text-[5px] font-bold uppercase leading-tight text-amber-700 dark:text-amber-400">
                            Finalizó
                          </span>
                        )}

                        {isUpcomingToday && (
                          <span
                            className={cn(
                              "max-w-full px-0.5 text-center text-[5px] font-bold uppercase leading-tight",
                              isNextInQueue
                                ? "text-violet-800 dark:text-violet-200"
                                : "text-violet-700/80 dark:text-violet-400/90"
                            )}
                          >
                            {isNextInQueue ? "Entra" : "Luego"}
                          </span>
                        )}

                        {isWorkDay && (
                          <span
                            className={cn(
                              "mt-0.5 h-0.5 w-3 rounded-full",
                              isActiveToday && "bg-emerald-500",
                              isEndedToday && "bg-amber-500/60",
                              isUpcomingToday &&
                                (isNextInQueue ? "bg-violet-500" : "bg-violet-400/40"),
                              todayStatus === "not-today" && "bg-foreground/35"
                            )}
                            aria-hidden
                          />
                        )}

                        <span
                          className={cn(
                            "w-full px-0.5 text-center leading-tight",
                            isOff &&
                              "text-[7px] font-medium uppercase tracking-wide text-muted-foreground/55",
                            isActiveToday &&
                              "font-mono text-[7px] font-bold text-emerald-900 dark:text-emerald-100",
                            (isEndedToday || isUpcomingToday) &&
                              "font-mono text-[7px] font-bold text-foreground/85",
                            isWorkDay &&
                              todayStatus === "not-today" &&
                              "font-mono text-[7px] font-bold text-foreground"
                          )}
                        >
                          {isOff ? (
                            "Libre"
                          ) : (
                            dayShifts.map((s, i) => (
                              <span key={i} className="block whitespace-nowrap">
                                {formatShiftRange(s, formatTime)}
                              </span>
                            ))
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[8px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm border border-foreground/25 bg-card shadow-sm" />
                    Turno
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm border border-dashed border-muted-foreground/30 bg-muted/70" />
                    Libre
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm border-2 border-emerald-500 bg-emerald-500/25" />
                    En turno
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm border border-amber-500/40 bg-card" />
                    Finalizó
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm border-2 border-violet-500/50 bg-violet-500/20" />
                    Por entrar
                  </span>
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Sin horario asignado
              </p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
