"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Info, Calendar as CalIcon } from "lucide-react";
import type { Operator, Shift } from "@/lib/types";
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
}

export function OperatorCard({
  operator: op,
  isAvailable,
  activeStats,
  activeEvent,
  currentWeekStart,
  formatTime,
}: OperatorCardProps) {
  const returnDateStr = activeEvent
    ? (() => {
        const endDate = new Date(activeEvent.endDate);
        return `${endDate.getDate().toString().padStart(2, "0")}/${(endDate.getMonth() + 1).toString().padStart(2, "0")}`;
      })()
    : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col border rounded-[6px] bg-card transition-all duration-300 hover:border-foreground/15 dark:hover:border-foreground/20",
        isAvailable
          ? "border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02]"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-[6px] border border-border relative overflow-visible">
            <AvatarImage src={op.image} className="rounded-[6px]" />
            <AvatarFallback className="rounded-[6px] bg-muted text-xs font-semibold">
              {op.name.charAt(0)}
            </AvatarFallback>
            {isAvailable && (
              <span className="absolute -inset-0.5 rounded-[6px] ring-2 ring-emerald-500/30 dark:ring-emerald-400/20 animate-pulse pointer-events-none" />
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
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {op.name}
            </h3>
            {op.role === "BOSS" && (
              <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isAvailable ? (
              <span className="text-foreground/90 font-medium flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                En turno ahora
              </span>
            ) : (
              "Fuera de turno"
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        {activeEvent && returnDateStr ? (
          <div className="border-l-4 border-l-amber-500 border border-border bg-amber-500/[0.02] dark:bg-amber-500/[0.03] rounded-[6px] px-3.5 py-3">
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
          <div className="space-y-2 border border-border bg-muted/15 rounded-[6px] p-3.5">
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
          <div className="flex-1 flex flex-col gap-2.5 border border-border bg-muted/10 rounded-[6px] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Esquema semanal
              </span>
              {op.isTempSchedule && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-[4px] border-border bg-background px-1.5 text-[9px] font-semibold text-muted-foreground shadow-none"
                >
                  Modificado
                </Badge>
              )}
            </div>

            {op.shifts && op.shifts.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center gap-1 select-none">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, dayIdx) => {
                    const activeShift = op.shifts?.find(s => s.days.includes(dayIdx));
                    const startOfWeekDate = new Date(currentWeekStart + "T12:00:00");
                    const todayDate = new Date();
                    const targetDate = new Date(startOfWeekDate);
                    targetDate.setDate(startOfWeekDate.getDate() + dayIdx);
                    const isTodayReal = targetDate.toDateString() === todayDate.toDateString();

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center py-1 rounded-[4px] border text-[9px] font-bold transition-all duration-200",
                          isTodayReal
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 scale-105"
                            : activeShift
                              ? "border-foreground/10 bg-foreground/[0.03] text-foreground"
                              : "border-transparent bg-transparent text-muted-foreground/30"
                        )}
                        title={activeShift ? `${dayLabel} (${formatTime(activeShift.start)} - ${formatTime(activeShift.end)})` : dayLabel}
                      >
                        <span>{dayLabel}</span>
                        {activeShift && !isTodayReal && (
                          <span className="h-1 w-1 rounded-full bg-foreground/30 mt-0.5" />
                        )}
                        {isTodayReal && (
                          <span className="h-1 w-1 rounded-full bg-emerald-500 mt-0.5 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {op.shifts.map((s, idx) => (
                    <span key={idx} className="text-[9px] font-mono font-semibold bg-muted/40 border border-border px-1.5 py-0.5 rounded-[4px] text-muted-foreground">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </span>
                  ))}
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
