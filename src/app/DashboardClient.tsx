"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Activity,
  ArrowUpRight,
  FileText,
  MessageCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  ChevronRight,
  Bell,
  Cake,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Report } from "@/types/report";

import Link from "next/link";
import { ProcessingModal } from "@/components/ProcessingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { ReminderModal } from "@/components/ReminderModal";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

function BitcentralPlaceholder() {
  return (
    <BentoCard variant="default" className="overflow-hidden h-full">
      <div className="flex flex-row items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground">Pauta Bitcentral</span>
            <p className="text-[11px] text-muted-foreground">Turnos de la semana</p>
          </div>
        </div>
      </div>
      <div className="p-2">
        <div className="flex flex-col gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-2.5 rounded-lg px-2 py-2"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted/50" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-muted/50" />
                <div className="h-2.5 w-16 rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
}

const BitcentralWidget = dynamic(
  () => import("@/components/BitcentralWidget").then((m) => m.BitcentralWidget),
  {
    ssr: false,
    loading: () => <BitcentralPlaceholder />,
  }
);
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { LiveActivityCard } from "@/components/dashboard/LiveActivityCard";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { STATUS_COLORS, STATUS_LABELS } from "@/config/constants";
import { pageContainerClass } from "@/lib/page-layout";
const ReportDetailModal = dynamic(
  () => import("@/components/ReportDetailModal").then((m) => m.ReportDetailModal),
  { ssr: false }
);
import {
  getReportDetailCache,
  prefetchReportDetail,
  invalidateReportDetailCache,
} from "@/lib/reportDetailCache";

import {
  useDashboardBundle,
  useBirthdayNotifications,
  useCurrentUser,
  useResolveReport,
  triggerRefetch,
} from "@/hooks/useDashboardData";

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    return "bg-[#FF0C60]/10 text-[#FF0C60]";
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

// ─── DashboardClient ──────────────────────────────────────────────────────────

export function DashboardClient() {
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });
  const [processingModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [cachedDetail, setCachedDetail] = useState<unknown | null>(null);

  const currentUser = useCurrentUser();
  const {
    stats,
    recentReports,
    chartData,
    users,
    comments,
    whatsappHealth,
    isReady,
  } = useDashboardBundle();

  useBirthdayNotifications(users, !isReady);

  const handleResolveSuccess = useCallback((msg: string) => {
    setSuccessModal({ isOpen: true, type: "success", message: msg });
  }, []);

  const handleResolveError = useCallback((msg: string) => {
    setSuccessModal({ isOpen: true, type: "error", message: msg });
  }, []);

  const handleResolve = useResolveReport(handleResolveSuccess, handleResolveError);

  const openReport = useCallback((report: Report) => {
    const cached = getReportDetailCache(report.id);
    setSelectedReport(report);
    setCachedDetail(cached);
    setDetailModalOpen(true);
    if (!cached) {
      prefetchReportDetail(report.id).then((data) => {
        if (data) setCachedDetail(data);
      });
    }
  }, []);

  const openReportById = useCallback(
    (reportId: string, hint?: { problemDescription?: string }) => {
      const fromList = recentReports.find((r) => r.id === reportId);
      const cached = getReportDetailCache(reportId);
      const base =
        fromList ??
        (cached as Report | null) ??
        ({
          id: reportId,
          problemDescription: hint?.problemDescription ?? "",
          operatorName: "",
          category: "",
          status: "pending",
          priority: "",
          createdAt: new Date().toISOString(),
        } as unknown as Report);

      setSelectedReport(base);
      setCachedDetail(cached);
      setDetailModalOpen(true);
      if (!cached) {
        prefetchReportDetail(reportId).then((data) => {
          if (data) setCachedDetail(data);
        });
      }
    },
    [recentReports]
  );

  const firstName = currentUser?.name?.trim()?.split(/\s+/)[0];
  const isEngineer = currentUser?.role === "ENGINEER";
  const wa = whatsappHealth as {
    success?: boolean;
    data?: { messagesSent?: number; messagesFailed?: number; queueSize?: number };
  } | null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-foreground/[0.02] blur-3xl" />
      </div>

      {/* Modals */}
      <ProcessingModal isOpen={processingModal.isOpen} title={processingModal.title} message={processingModal.message} />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        type={successModal.type}
        title={successModal.type === "success" ? "Operación Exitosa" : "Error"}
        message={successModal.message}
      />
      <ReportDetailModal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedReport(null); setCachedDetail(null); }}
        report={selectedReport}
        initialDetail={cachedDetail}
        currentUser={currentUser}
        onUpdate={() => { if (selectedReport?.id) invalidateReportDetailCache(selectedReport.id); triggerRefetch("dashboard"); }}
      />
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        operators={users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, image: u.image }))}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={pageContainerClass}>
        {!isReady ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-4 md:space-y-5"
          >
            {/* ═══════ ROW 1: Hero ═══════ */}
            <DashboardHero
              firstName={firstName}
              isEngineer={isEngineer}
              reportsToday={stats.reportsToday}
              pendingCount={stats.pendingReports}
            />

            {/* ═══════ ROW 2: Stats ═══════ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatsCard
                title="Total reportes"
                value={stats.totalReports}
                subtitle={`+${stats.reportsToday} hoy`}
                icon={<Activity className="h-5 w-5" />}
                variant="default"
              />
              <StatsCard
                title="Pendientes"
                value={stats.pendingReports}
                subtitle="Por revisar"
                icon={<Clock className="h-5 w-5" />}
                variant="danger"
              />
              <StatsCard
                title="Resueltos"
                value={stats.resolvedReports}
                subtitle="Cerrados"
                icon={<CheckCircle className="h-5 w-5" />}
                variant="success"
              />
            </div>

            {/* ═══════ MAIN CONTENT BENTO GRID ═══════ */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              
              {/* Bento Card 1: Recent Reports (spans 2 cols on large screens) */}
              <div className="xl:col-span-2 flex flex-col gap-4">
                {/* Pending alerts (compact, inline) */}
                {stats.pendingReports > 0 && (
                  <BentoCard variant="default">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                        <Bell className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {stats.pendingReports} reporte{stats.pendingReports !== 1 ? "s" : ""} pendiente{stats.pendingReports !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Requiere{stats.pendingReports === 1 ? "" : "n"} atención</p>
                      </div>
                      {recentReports.filter(r => r.status === 'pending').slice(0, 2).map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => openReport(r)}
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

                {/* Recent Reports */}
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
                      <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                        Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                  {recentReports.length > 0 ? (
                    <ul className="divide-y divide-border/20">
                      {recentReports.slice(0, 5).map((report) => (
                        <ReportListItem
                          key={report.id}
                          report={report}
                          onResolve={handleResolve}
                          onOpen={openReport}
                        />
                      ))}
                    </ul>
                  ) : (
                    <EmptyReportsState />
                  )}
                </BentoCard>
              </div>

              {/* Bento Card 2: Bitcentral Schedule (spans 1 col on large screens) */}
              <div className="flex flex-col">
                <BitcentralWidget users={users} className="h-full" />
              </div>

              {/* Bento Card 3: Weekly Trend Chart (spans 2 cols on large screens, only for engineers) */}
              {isEngineer && (
                <div className="xl:col-span-2 flex flex-col">
                  <BentoCard variant="default" className="flex-1">
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
                      <WeeklyTrendChart loading={false} chartData={chartData} />
                    </div>
                  </BentoCard>
                </div>
              )}

              {/* Bento Card 4: BirthdayWidget (spans 2 cols if not engineer to fill layout, else 1 col) */}
              <div className={cn("flex flex-col", !isEngineer ? "xl:col-span-2" : "xl:col-span-1")}>
                <BirthdayWidget users={users} className="h-full" />
              </div>

              {/* Bento Card 5: Live Activity (spans 2 cols if engineer, else 1 col to perfectly fill layout) */}
              <div className={cn("flex flex-col", isEngineer ? "xl:col-span-2" : "xl:col-span-1")}>
                <BentoCard variant="default" className="h-full">
                  <LiveActivityCard
                    comments={comments}
                    loading={false}
                    onReportClick={(reportId, hint) => openReportById(reportId, hint)}
                  />
                </BentoCard>
              </div>

              {/* Bento Card 6: WhatsApp Status (spans 3 cols if not engineer as a utility bar, else 1 col) */}
              <div className={cn("flex flex-col", !isEngineer ? "xl:col-span-3" : "xl:col-span-1")}>
                <BentoCard variant="default" className="h-full">
                  <div className="p-4 md:p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          wa?.success
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {wa?.success ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {wa?.success ? "Conectado" : wa ? "Desconectado" : "Sin configurar"}
                        </p>
                      </div>
                      {wa?.success && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Activo
                        </span>
                      )}
                    </div>

                    {wa?.data && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">Mensajes hoy</p>
                          <p className="text-lg font-semibold tabular-nums text-foreground">
                            {wa.data.messagesSent || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">Errores</p>
                          <p
                            className={`text-lg font-semibold tabular-nums ${
                              (wa.data.messagesFailed ?? 0) > 0
                                ? "text-red-500"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {wa.data.messagesFailed || 0}
                          </p>
                        </div>
                        {(wa.data.queueSize ?? 0) > 0 && (
                          <div className="col-span-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                              {wa.data.queueSize} mensaje(s) en cola
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!wa && (
                      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                        Conecta la API de WhatsApp para enviar recordatorios automáticos al equipo.
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-full gap-2 rounded-lg border-border/40 text-xs font-medium"
                      onClick={() => setReminderModalOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar recordatorio manual
                    </Button>
                  </div>
                </BentoCard>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function EmptyReportsState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/40">
        <Activity className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-foreground/90">No hay reportes recientes</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Cuando se registren incidencias, aparecerán aquí. También puedes ver el historial completo en Reportes.
      </p>
      <Button
        asChild
        className="mt-6 rounded-xl bg-[#FF0C60] font-semibold text-white shadow-none hover:bg-[#E00A54]"
      >
        <Link href="/crear-reporte">Crear reporte</Link>
      </Button>
    </div>
  );
}
