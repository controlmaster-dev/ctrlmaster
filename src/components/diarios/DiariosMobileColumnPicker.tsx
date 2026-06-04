"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/components/navbar/navConfig";
import type { DiariosOperator } from "@/types/operatorDuty";
import { cn } from "@/lib/utils";

type DiariosMobileColumnPickerProps = {
  operators: DiariosOperator[];
  selectedId: string;
  dutyCounts: Record<string, number>;
  onSelect: (id: string) => void;
};

export function DiariosMobileColumnPicker({
  operators,
  selectedId,
  dutyCounts,
  onSelect,
}: DiariosMobileColumnPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = tabRefs.current[selectedId];
    if (!el || !scrollRef.current) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  return (
    <div
      className="diarios-mobile-picker shrink-0 border-b border-border bg-background/95 px-2 py-2 md:hidden"
      role="tablist"
      aria-label="Seleccionar operador"
    >
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {operators.map((op) => {
          const active = op.id === selectedId;
          const count = dutyCounts[op.id] ?? 0;
          return (
            <button
              key={op.id}
              ref={(node) => {
                tabRefs.current[op.id] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`diarios-panel-${op.id}`}
              id={`diarios-tab-${op.id}`}
              onClick={() => onSelect(op.id)}
              className={cn(
                "flex shrink-0 touch-manipulation items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                active
                  ? "border-brand/40 bg-card text-foreground shadow-sm ring-1 ring-brand/25"
                  : "border-border/70 bg-muted/40 text-muted-foreground"
              )}
            >
              <Avatar className="h-7 w-7 border border-border/60">
                <AvatarImage src={op.image || ""} alt={op.name} />
                <AvatarFallback className="text-[9px] font-semibold">
                  {getInitials(op.name)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[6.5rem] truncate text-xs font-semibold">
                {op.name.split(" ")[0]}
              </span>
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
                  active ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
