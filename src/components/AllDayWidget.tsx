"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, Shield, Sparkles } from "lucide-react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

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

export function AllDayWidget({ operators, specialEvents = [] }: AllDayWidgetProps) {
  
  const formatTime = (h: number) => {
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}${ampm}`;
  };

  const getDayOperators = (date: Date) => {
    const dayIndex = date.getDay();
    const result: { op: Operator; shift: Shift }[] = [];

    operators.forEach(op => {
      if (!op.shifts) return;
      op.shifts.forEach(shift => {
        if (shift.days.includes(dayIndex)) {
          result.push({ op, shift });
        }
      });
    });

    // Sort by start time
    return result.sort((a, b) => a.shift.start - b.shift.start);
  };

  const todayOperators = useMemo(() => getDayOperators(new Date()), [operators]);
  const tomorrowOperators = useMemo(() => getDayOperators(addDays(new Date(), 1)), [operators]);

  const activeEvent = useMemo(() => {
    const now = new Date();
    return specialEvents.find(e => {
      if (!e.isActive) return false;
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });
  }, [specialEvents]);

  const OperatorItemList = ({ list, label, date, delay }: { list: { op: Operator; shift: Shift }[], label: string, date: Date, delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF0C60]">{label}</span>
        <span className="text-[10px] font-medium text-muted-foreground/60">{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
      </div>

      <div className="grid gap-2">
        {list.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-border rounded-xl bg-muted/5">
            <p className="text-[10px] text-muted-foreground italic">No hay turnos programados</p>
          </div>
        ) : (
          list.map((item, idx) => (
            <div 
              key={`${item.op.id}-${idx}`}
              className="group relative"
            >
              <Card className="overflow-hidden border-border bg-card/40 backdrop-blur-md transition-all duration-300 hover:bg-card/60 hover:translate-x-1 ring-1 ring-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border shrink-0">
                      <AvatarImage src={item.op.image || item.op.avatar} />
                      <AvatarFallback className="bg-muted text-xs font-bold">{item.op.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <h4 className="text-xs font-bold text-foreground truncate">{item.op.name}</h4>
                        {item.op.isTempSchedule && <div className="w-1 h-1 bg-amber-500 rounded-full shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                          <Clock className="w-2.5 h-2.5 opacity-50" />
                          <span>{formatTime(item.shift.start)} - {formatTime(item.shift.end)}</span>
                        </div>
                        {item.op.role?.toUpperCase() === 'BOSS' && (
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-amber-500/80 bg-amber-500/5 px-1 rounded border border-amber-500/10">
                            <Shield className="w-2 h-2" />
                            ADMIN
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF0C60]/10 rounded-xl border border-[#FF0C60]/20">
            <CalendarDays className="w-4 h-4 text-[#FF0C60]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Turnos del Día</h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70 italic">Horario de Operaciones</p>
          </div>
        </div>
      </div>

      {/* Featured Event if any */}
      {activeEvent && (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-sm"
        >
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-500" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">Evento en curso</p>
                <h3 className="text-xs font-bold text-foreground leading-tight">{activeEvent.name}</h3>
             </div>
          </div>
        </motion.div>
      )}

      {/* Lists */}
      <div className="space-y-10">
        <OperatorItemList label="Hoy" list={todayOperators} date={new Date()} delay={0.1} />
        <OperatorItemList label="Mañana" list={tomorrowOperators} date={addDays(new Date(), 1)} delay={0.2} />
      </div>

      {/* Footer Info */}
      <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
        <p className="text-[9px] text-muted-foreground leading-relaxed text-center font-medium opacity-60">
          Los turnos se actualizan dinámicamente según la programación semanal establecida.
        </p>
      </div>
    </div>
  );
}
