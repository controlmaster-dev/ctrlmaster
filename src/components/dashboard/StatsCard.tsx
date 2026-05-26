import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  valueColor = "text-foreground",
  variant = "default",
}: StatsCardProps) {
  const variants = {
    default: "border-blue-500/25 bg-blue-500/5",
    success: "border-emerald-500/25 bg-emerald-500/5",
    warning: "border-orange-500/25 bg-orange-500/5",
    danger: "border-rose-500/25 bg-rose-500/5",
  };

  const iconColors = {
    default: "text-blue-500 bg-blue-500/10",
    success: "text-emerald-500 bg-emerald-500/10",
    warning: "text-orange-500 bg-orange-500/10",
    danger: "text-rose-500 bg-rose-500/10",
  };

  return (
    <Card
      className={`overflow-hidden rounded-xl border bg-card/80 shadow-sm ${variants[variant]}`}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`shrink-0 rounded-lg p-2.5 ${iconColors[variant]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {variant === "danger" && value > 0 && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
          </div>
          <p className={`mt-0.5 text-2xl font-semibold tabular-nums leading-none ${valueColor}`}>
            {value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
