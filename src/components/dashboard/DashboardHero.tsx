"use client";

import Link from "next/link";
import {
  MonitorPlay,
  Users as UsersIcon,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardHeroProps {
  firstName?: string;
  isEngineer?: boolean;
  reportsToday: number;
  pendingCount: number;
}

export function DashboardHero({
  firstName,
  isEngineer,
  reportsToday,
  pendingCount,
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
    <section className="rounded-sm border border-border/60 bg-card shadow-sm">
      <div className="p-4 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Panel de control
              </span>
              <span className="rounded-sm border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                {dateLabel}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground lg:ml-auto">
                {timeLabel}
              </span>
            </div>

            <div>
              {firstName && (
                <p className="text-xs text-muted-foreground">
                  Hola,{" "}
                  <span className="font-semibold text-foreground">{firstName}</span>
                </p>
              )}
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                {isEngineer ? (
                  <>
                    Ingeniería{" "}
                    <span className="text-foreground">Master</span>
                  </>
                ) : (
                  <>
                    Control{" "}
                    <span className="text-[#FF0C60]">Master</span>
                  </>
                )}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <span>
                Resumen del día: incidencias, equipo en turno y servicios.
              </span>
              <span className="hidden h-3 w-px bg-border/60 sm:inline-block" />
              <span className="rounded-sm border border-border/50 bg-muted/30 px-2 py-0.5">
                <span className="font-semibold text-foreground">{reportsToday}</span>{" "}
                reportes hoy
              </span>
              {pendingCount > 0 ? (
                <span className="rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 font-medium text-foreground">
                  {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5">
                  Sin pendientes críticos
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <div className="flex items-center gap-1 rounded-sm border border-border/50 bg-muted/30 p-0.5">
              <Link href="/operadores/monitoreo">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-none px-2.5 text-xs hover:bg-background/80"
                >
                  <MonitorPlay className="h-3.5 w-3.5" />
                  Monitoreo
                </Button>
              </Link>
              <Link href="/operadores">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-none px-2.5 text-xs hover:bg-background/80"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Horarios
                </Button>
              </Link>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
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
                  <TooltipContent side="top">
                    <p>Manual en PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
