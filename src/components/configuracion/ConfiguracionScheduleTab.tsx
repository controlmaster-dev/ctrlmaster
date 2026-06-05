"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import type { ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import type { Shift } from "@/lib/types";

type ConfiguracionScheduleTabProps = {
  users: ConfiguracionUserCard[];
  scheduleMode: string;
  onScheduleModeChange: (mode: string) => void;
  currentWeekStart: string;
  onWeekChange: (weekStart: string) => void;
  onUpdateSchedule: (userId: string, newShifts: Shift[], weekStart: string) => void;
};

export function ConfiguracionScheduleTab({
  users,
  scheduleMode,
  onScheduleModeChange,
  currentWeekStart,
  onWeekChange,
  onUpdateSchedule,
}: ConfiguracionScheduleTabProps) {
  return (
    <Card className="flex h-fit flex-col overflow-hidden rounded-lg border border-border bg-card shadow-none">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border bg-muted/10 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold leading-none text-foreground">Gestión de Horarios</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Configuración del esquema y asignación semanal de turnos.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => onScheduleModeChange("weekly")}
            className={`rounded-[4px] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
              scheduleMode === "weekly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semanal (Temp)
          </button>
          <button
            type="button"
            onClick={() => onScheduleModeChange("default")}
            className={`rounded-[4px] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
              scheduleMode === "default"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Predeterminado
          </button>
        </div>
      </div>
      <div className="relative">
        {scheduleMode === "default" && (
          <div className="absolute left-0 top-0 z-20 h-0.5 w-full animate-pulse bg-brand" />
        )}
        <WeeklyCalendar
          operators={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email || "",
            image: u.image,
            role: u.role || "OPERATOR",
            shifts: (scheduleMode === "default" ? u.defaultShifts : u.shifts) || [],
            isTempSchedule: scheduleMode === "weekly" ? u.isTempSchedule : false,
          }))}
          currentWeekStart={currentWeekStart}
          onWeekChange={onWeekChange}
          onUpdateSchedule={onUpdateSchedule}
        />
      </div>
    </Card>
  );
}
