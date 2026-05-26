"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Shield } from "lucide-react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface Shift {
  days: number[];
  start: number;
  end: number;
}

interface Operator {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  role?: string;
  shifts?: Shift[];
  isTempSchedule?: boolean;
}

interface SpecialEvent {
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface AllDayWidgetProps {
  operators: Operator[];
  specialEvents?: SpecialEvent[];
}

function formatTime(h: number) {
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return name;
}

function getDayOperators(operators: Operator[], date: Date) {
  const dayIndex = date.getDay();
  const result: { op: Operator; shift: Shift }[] = [];

  operators.forEach((op) => {
    if (!op.shifts) return;
    op.shifts.forEach((shift) => {
      if (shift.days.includes(dayIndex)) {
        result.push({ op, shift });
      }
    });
  });

  return result.sort((a, b) => a.shift.start - b.shift.start);
}

function DayShiftList({
  label,
  list,
  date,
}: {
  label: string;
  list: { op: Operator; shift: Shift }[];
  date: Date;
}) {
  const dateLabel = format(date, "EEEE d MMM", { locale: es });

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="truncate text-[11px] capitalize text-muted-foreground">
          {dateLabel}
        </span>
      </div>

      {list.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-muted-foreground">
          Sin turnos
        </p>
      ) : (
        <ul className="divide-y divide-border/40 rounded-lg border border-border/50 bg-muted/10">
          {list.map((item, idx) => (
            <li
              key={`${item.op.id}-${idx}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {getInitials(item.op.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
                    {formatName(item.op.name)}
                    {item.op.role?.toUpperCase() === "BOSS" && (
                      <Shield className="h-3 w-3 shrink-0 text-[#FF0C60]" />
                    )}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border/50">
                {formatTime(item.shift.start)} – {formatTime(item.shift.end)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AllDayWidget({ operators, specialEvents = [] }: AllDayWidgetProps) {
  const todayOperators = useMemo(
    () => getDayOperators(operators, new Date()),
    [operators]
  );
  const tomorrowOperators = useMemo(
    () => getDayOperators(operators, addDays(new Date(), 1)),
    [operators]
  );

  const activeEvent = useMemo(() => {
    const now = new Date();
    return specialEvents.find((e) => {
      if (!e.isActive) return false;
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });
  }, [specialEvents]);

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF0C60]/10 text-[#FF0C60]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Turnos del día</CardTitle>
            <p className="text-[11px] text-muted-foreground">Hoy y mañana</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4">
        {activeEvent && (
          <div className="rounded-lg border border-[#FF0C60]/20 bg-[#FF0C60]/5 px-3 py-2">
            <p className="text-[10px] font-medium text-[#FF0C60]">Evento activo</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {activeEvent.name}
            </p>
          </div>
        )}

        <DayShiftList label="Hoy" list={todayOperators} date={new Date()} />
        <DayShiftList
          label="Mañana"
          list={tomorrowOperators}
          date={addDays(new Date(), 1)}
        />
      </CardContent>
    </Card>
  );
}
