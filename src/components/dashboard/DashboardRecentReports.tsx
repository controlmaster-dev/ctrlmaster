"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { STATUS_COLORS, STATUS_LABELS } from "@/config/constants";
import { prefetchReportDetail } from "@/lib/reportDetailCache";
import type { Report } from "@/types/report";

function reportInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function priorityBadgeClass(priority: string) {
  if (priority === "Enlace" || priority === "Enlace USA") {
    return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
  }
  if (priority === "EJTV") {
    return "bg-brand/10 text-brand";
  }
  return "bg-muted text-muted-foreground";
}

const ReportListItem = React.memo(function ReportListItem({
  report,
  onResolve,
  onOpen,
}: {
  report: Report;
  onResolve: (id: string, e: React.MouseEvent) => void;
  onOpen: (report: Report) => void;
}) {
  const createdLabel =
    report.createdAt &&
    formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });

  return (
    <li className="border-b border-border/20 last:border-0">
      <div
        role="button"
        tabIndex={0}
        className="group relative flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 md:px-5"
        onMouseEnter={() => prefetchReportDetail(report.id)}
        onClick={() => onOpen(report)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(report);
          }
        }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-[10px] font-semibold text-muted-foreground">
          {reportInitials(report.operatorName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {report.problemDescription}
            </p>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-md border px-2 py-0 text-[10px] font-medium ${STATUS_COLORS[report.status] ?? ""}`}
            >
              {STATUS_LABELS[report.status] ?? report.status}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">#{report.id.slice(0, 6)}</span>
            <span aria-hidden>·</span>
            <span>{report.operatorName.split(" ")[0]}</span>
            <span aria-hidden>·</span>
            <span className={`rounded px-1.5 py-px font-medium ${priorityBadgeClass(report.priority)}`}>
              {report.priority}
            </span>
            {createdLabel && (
              <>
                <span aria-hidden>·</span>
                <span>{createdLabel}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {report.status !== "resolved" && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
              title="Marcar como resuelto"
              aria-label="Marcar como resuelto"
              onClick={(e) => onResolve(report.id, e)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
        </div>
      </div>
    </li>
  );
});

function EmptyReportsState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/40">
        <Activity className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-foreground/90">No hay reportes recientes</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Cuando se registren incidencias, aparecerán aquí. También puedes ver el historial completo en
        Reportes.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-6 h-9 rounded-lg text-xs">
        <Link href="/crear-reporte">Crear reporte</Link>
      </Button>
    </div>
  );
}

type DashboardRecentReportsProps = {
  pendingCount: number;
  reports: Report[];
  onResolve: (id: string, e: React.MouseEvent) => void;
  onOpen: (report: Report) => void;
};

export function DashboardRecentReports({
  pendingCount,
  reports,
  onResolve,
  onOpen,
}: DashboardRecentReportsProps) {
  const pending = reports.filter((r) => r.status === "pending");

  return (
    <>
      {pendingCount > 0 && (
        <BentoCard variant="default">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {pendingCount} reporte{pendingCount !== 1 ? "s" : ""} pendiente
                {pendingCount !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Requiere{pendingCount === 1 ? "" : "n"} atención
              </p>
            </div>
            {pending.slice(0, 2).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onOpen(r)}
                onMouseEnter={() => prefetchReportDetail(r.id)}
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
              >
                <span className="font-mono text-[10px]">#{r.id.slice(0, 6)}</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            ))}
            <Link href="/reportes">
              <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs">
                Ver todos <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </BentoCard>
      )}

      <BentoCard variant="elevated" className="flex-1">
        <div className="flex items-center justify-between border-b border-border/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Últimos reportes</p>
              <p className="text-[11px] text-muted-foreground">Incidencias recientes del equipo</p>
            </div>
          </div>
          <Link href="/reportes">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        {reports.length > 0 ? (
          <ul className="divide-y divide-border/20">
            {reports.slice(0, 5).map((report) => (
              <ReportListItem
                key={report.id}
                report={report}
                onResolve={onResolve}
                onOpen={onOpen}
              />
            ))}
          </ul>
        ) : (
          <EmptyReportsState />
        )}
      </BentoCard>
    </>
  );
}
