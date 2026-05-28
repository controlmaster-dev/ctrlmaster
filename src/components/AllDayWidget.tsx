"use client";

import { useMemo } from "react";
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
      <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-border/40 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="truncate text-[10px] capitalize text-muted-foreground font-medium">
          {dateLabel}
        </span>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/5">
          Sin turnos
        </p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((item, idx) => (
            <li
              key={`${item.op.id}-${idx}`}
              className="flex items-center justify-between gap-3 border border-border bg-card hover:bg-muted/10 rounded-lg p-2 transition-all duration-200"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground rounded-lg">
                  {getInitials(item.op.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                    {formatName(item.op.name)}
                    {item.op.role?.toUpperCase() === "BOSS" && (
                      <Shield className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                  </p>
                </div>
              </div>
              <span className="shrink-0 border border-border bg-muted/30 px-2 py-0.5 font-mono text-[9px] text-muted-foreground rounded-md">
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
    <section className="border border-border bg-card rounded-lg overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/10">
        <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted/30 text-muted-foreground rounded-lg">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Turnos del día</h2>
          <p className="text-[10px] text-muted-foreground font-medium">Hoy y mañana</p>
        </div>
      </header>

      <div className="space-y-5 p-4">
        {activeEvent && (
          <div className="border border-border bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Evento activo
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
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
      </div>
    </section>
  );
}
