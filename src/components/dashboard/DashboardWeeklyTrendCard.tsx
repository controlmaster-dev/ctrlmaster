"use client";

import { Activity } from "lucide-react";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";

type DashboardWeeklyTrendCardProps = {
  chartData: {
    labels: string[];
    values: number[];
  };
  loading?: boolean;
  className?: string;
};

export function DashboardWeeklyTrendCard({
  chartData,
  loading = false,
  className,
}: DashboardWeeklyTrendCardProps) {
  return (
    <BentoCard variant="default" className={className ?? "flex-1"}>
      <div className="flex items-center gap-2.5 border-b border-border/30 px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Tendencia semanal</p>
          <p className="text-[11px] text-muted-foreground">Reportes en los últimos 7 días</p>
        </div>
      </div>
      <div className="flex h-[220px] w-full flex-col justify-between p-4 md:p-5">
        <WeeklyTrendChart loading={loading} chartData={chartData} />
      </div>
    </BentoCard>
  );
}
