"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Info, Calendar as CalIcon } from "lucide-react";
import type { Operator, Shift } from "@/lib/types";

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
      className={`flex h-full flex-col border bg-card shadow-sm transition-colors hover:border-border ${
        isAvailable
          ? "border-l-2 border-l-emerald-600/70 border-border/70"
          : "border-border/60"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-sm border border-border/60">
            <AvatarImage src={op.image} className="rounded-sm" />
            <AvatarFallback className="rounded-sm bg-muted text-xs font-medium">
              {op.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-px -right-px h-2 w-2 border border-card ${
              isAvailable ? "bg-emerald-600" : "bg-muted-foreground/50"
            }`}
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
              <span className="text-foreground/90">En turno ahora</span>
            ) : (
              "Fuera de turno"
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {activeEvent && returnDateStr ? (
          <div className="border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <CalIcon className="h-3 w-3" />
              Horario especial
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {activeEvent.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Retorno estimado:{" "}
              <span className="font-medium text-foreground">{returnDateStr}</span>
            </p>
          </div>
        ) : null}

        {!activeEvent && activeStats ? (
          <div className="space-y-2 border border-border/50 bg-muted/15 px-3 py-2.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Turno en curso</span>
              <span className="font-mono tabular-nums text-foreground">
                {activeStats.remaining}
              </span>
            </div>
            <div className="h-1 overflow-hidden bg-border/60">
              <div
                className="h-full bg-foreground/70 transition-all duration-700"
                style={{ width: `${activeStats.progress}%` }}
              />
            </div>
            <p className="text-right font-mono text-[10px] text-muted-foreground">
              {activeStats.label}
            </p>
          </div>
        ) : null}

        {!activeEvent ? (
          <div className="flex-1 border border-border/50 bg-muted/10 px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Horario semanal
              </span>
              {op.isTempSchedule && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-sm border-border/60 bg-background px-1.5 text-[9px] font-normal text-muted-foreground"
                >
                  Modificado
                </Badge>
              )}
            </div>

            {op.shifts && op.shifts.length > 0 ? (
              <ul className="space-y-1">
                {op.shifts.map((shift: Shift, sIdx: number) => {
                  if (!shift.days?.length) return null;
                  const startOfWeekDate = new Date(currentWeekStart + "T12:00:00");
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
                    <li
                      key={sIdx}
                      className={`flex items-center justify-between gap-2 border-b border-border/30 py-1.5 text-xs last:border-0 ${
                        isTodayReal ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span className={isTodayReal ? "font-medium" : ""}>
                        {formattedDateLabels}
                      </span>
                      <span
                        className={`shrink-0 px-1.5 py-px font-mono text-[10px] ${
                          isTodayReal
                            ? "bg-foreground/10 text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(shift.start)} – {formatTime(shift.end)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
