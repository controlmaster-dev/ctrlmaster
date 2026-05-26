"use client";

import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className={`h-full overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        isAvailable
          ? "border-emerald-500/30 bg-card ring-1 ring-emerald-500/20"
          : "border-border/60 bg-card/80"
      }`}
    >
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar
              className={`h-11 w-11 border-2 ${
                isAvailable ? "border-emerald-500" : "border-border"
              }`}
            >
              <AvatarImage src={op.image} />
              <AvatarFallback className="bg-muted text-sm font-medium">
                {op.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                isAvailable ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {op.name}
              </h3>
              {op.role === "BOSS" && (
                <Shield className="h-3.5 w-3.5 shrink-0 text-[#FF0C60]" />
              )}
            </div>
            <Badge
              variant="outline"
              className={`mt-1.5 h-5 border px-2 text-[10px] font-medium ${
                isAvailable
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              }`}
            >
              {isAvailable ? "En turno" : "Fuera de turno"}
            </Badge>
          </div>
        </div>

        {activeEvent && returnDateStr ? (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-[#FF0C60]">
              <CalIcon className="h-3 w-3" />
              Horario especial
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {activeEvent.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Retorno:{" "}
              <span className="font-medium text-[#FF0C60]">{returnDateStr}</span>
            </p>
          </div>
        ) : null}

        {!activeEvent && activeStats ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
              <span>Turno en curso</span>
              <span className="font-mono tabular-nums">{activeStats.remaining}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-emerald-500/20">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${activeStats.progress}%` }}
              />
            </div>
            <p className="text-right font-mono text-[10px] text-muted-foreground">
              {activeStats.label}
            </p>
          </div>
        ) : null}

        {!activeEvent ? (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Horario semanal
              </span>
              {op.isTempSchedule && (
                <Badge
                  variant="outline"
                  className="h-4 border-[#FF0C60]/25 bg-[#FF0C60]/10 px-1.5 text-[9px] text-[#FF0C60]"
                >
                  Modificado
                </Badge>
              )}
            </div>

            {op.shifts && op.shifts.length > 0 ? (
              <ul className="space-y-1.5">
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
                      className={`flex items-center justify-between gap-2 text-xs ${
                        isTodayReal ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span className={isTodayReal ? "font-medium" : ""}>
                        {formattedDateLabels}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          isTodayReal
                            ? "border border-[#FF0C60]/20 bg-card text-[#FF0C60]"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {formatTime(shift.start)} – {formatTime(shift.end)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Sin horario asignado
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
