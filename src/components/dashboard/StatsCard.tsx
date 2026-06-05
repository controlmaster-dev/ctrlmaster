import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const iconTint = {
  default: "text-muted-foreground",
  success: "text-muted-foreground",
  warning: "text-muted-foreground",
  danger: "text-muted-foreground",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  valueColor = "text-foreground",
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 backdrop-blur-sm transition-all duration-300 hover:border-foreground/15 dark:hover:border-foreground/20 md:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {variant === "danger" && value > 0 && (
              <span className="relative flex h-2 w-2 shrink-0 rounded-full bg-rose-500/80" />
            )}
          </div>
          <p
            className={cn(
              "mt-1.5 text-3xl font-bold tabular-nums tracking-tight md:text-4xl",
              valueColor
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/40",
            iconTint[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
