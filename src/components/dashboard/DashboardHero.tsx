"use client";

import Link from "next/link";
import {
  MonitorPlay,
  Users as UsersIcon,
  FileText,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BentoCard } from "./BentoCard";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  firstName?: string;
  isEngineer?: boolean;
  reportsToday: number;
  pendingCount: number;
  className?: string;
}

export function DashboardHero({
  firstName,
  isEngineer,
  reportsToday,
  pendingCount,
  className,
}: DashboardHeroProps) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = today.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <BentoCard variant="elevated" className={cn("p-5 md:p-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Top date/time row */}
          <div className="flex items-center text-[11px] font-medium text-muted-foreground/70 capitalize tracking-wider select-none">
            <span>{dateLabel}</span>
            <span className="mx-1.5 text-muted-foreground/40 font-normal">·</span>
            <span className="tabular-nums text-muted-foreground/60">{timeLabel}</span>
          </div>

          {/* Greeting + title */}
          <div>
            {firstName && (
              <p className="text-sm text-muted-foreground">
                Hola,{" "}
                <span className="font-semibold text-foreground">{firstName}</span>
              </p>
            )}
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {isEngineer ? (
                <>
                  Ingeniería{" "}
                  <span className="text-foreground">Master</span>
                </>
              ) : (
                <>
                  Control{" "}
                  <span className="text-brand">Master</span>
                </>
              )}
            </h1>
          </div>

          {/* Inline stats + quick actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mini stat pills */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs">
                <span className="text-base font-bold tabular-nums text-foreground">
                  {reportsToday}
                </span>
                <span className="text-muted-foreground">reportes hoy</span>
              </span>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {pendingCount}
                  </span>
                  <span className="text-muted-foreground">pendiente{pendingCount !== 1 ? "s" : ""}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Todo al día
                </span>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="hidden items-center gap-1 md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                asChild
              >
                <Link href="/operadores/monitoreo">
                  <MonitorPlay className="h-3.5 w-3.5" />
                  Monitoreo
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                asChild
              >
                <Link href="/operadores">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Horarios
                </Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      asChild
                    >
                      <a
                        href="/Manual de Control.pdf"
                        download="Manual de Control.pdf"
                        aria-label="Descargar manual"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manual en PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Right side: CTA */}
        <div className="hidden shrink-0 md:block">
          <Button
            className="h-10 gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-none hover:bg-brand-hover"
            asChild
          >
            <Link href="/crear-reporte">
              Nuevo reporte
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
