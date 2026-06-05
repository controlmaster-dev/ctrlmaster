"use client";

import { BarChart3 } from "lucide-react";
import { BentoCard } from "@/components/dashboard/BentoCard";
import type { OperatorStat } from "@/components/reportes/reportes-types";

export function ReportesOperatorStats({ stats }: { stats: OperatorStat[] }) {
  if (stats.length === 0) return null;

  return (
    <BentoCard variant="default" className="p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        Por operador
      </h3>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((op) => (
          <div key={op.name} className="bg-card p-3">
            <p className="mb-2 truncate text-sm font-medium">{op.name}</p>
            <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
              <div>
                <p className="text-base font-semibold tabular-nums">{op.total}</p>
                <p className="text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-foreground">{op.pending}</p>
                <p className="text-muted-foreground">Pend.</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-foreground">{op.resolved}</p>
                <p className="text-muted-foreground">Res.</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums">{op.emailSent}</p>
                <p className="text-muted-foreground">Mail</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
