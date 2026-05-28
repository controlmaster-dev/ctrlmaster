"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Report } from "@/types/report";

import Link from "next/link";
import { ProcessingModal } from "@/components/ProcessingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { ReminderModal } from "@/components/ReminderModal";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const BitcentralWidget = dynamic(
  () => import("@/components/BitcentralWidget").then((m) => m.BitcentralWidget),
  { ssr: false }
);
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { LiveActivityCard } from "@/components/dashboard/LiveActivityCard";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { BirthdayWidget } from "@/components/BirthdayWidget";
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
    <li className="border-b border-border/30 last:border-0">
      <div
        role="button"
        tabIndex={0}
        className="group relative flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 md:px-5"
        onMouseEnter={() => prefetchReportDetail(report.id)}
        onClick={() => onOpen(report)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(report);
          }
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-muted/30 text-[10px] font-semibold text-muted-foreground">
          {reportInitials(report.operatorName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {report.problemDescription}
            </p>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-sm border px-2 py-0 text-[10px] font-medium ${STATUS_COLORS[report.status] ?? ""}`}
            >
              {STATUS_LABELS[report.status] ?? report.status}
            </Badge>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">#{report.id.slice(0, 6)}</span>
            <span aria-hidden>·</span>
            <span>{report.operatorName.split(" ")[0]}</span>
            <span aria-hidden>·</span>
            <span
              className={`rounded px-1.5 py-px font-medium ${priorityBadgeClass(report.priority)}`}
            >
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

/**
 * Main dashboard client component.
 * Composes data hooks with UI components for a clean separation of concerns.
 */
export function DashboardClient() {
  // ── State ──────────────────────────────────────────────────────────────────
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

  // ── Data hooks ─────────────────────────────────────────────────────────────
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

  // ── Side effects ───────────────────────────────────────────────────────────
  useBirthdayNotifications(users, !isReady);

  // ── Handlers ───────────────────────────────────────────────────────────────
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const firstName = currentUser?.name?.trim()?.split(/\s+/)[0];
  const isEngineer = currentUser?.role === "ENGINEER";
  const wa = whatsappHealth as {
    success?: boolean;
    data?: { messagesSent?: number; messagesFailed?: number; queueSize?: number };
  } | null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-foreground/[0.02] blur-3xl" />
      </div>

      {/* Modals */}
      <ProcessingModal
        isOpen={processingModal.isOpen}
        title={processingModal.title}
        message={processingModal.message}
      />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        type={successModal.type}
        title={successModal.type === "success" ? "Operación Exitosa" : "Error"}
        message={successModal.message}
      />
      <ReportDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReport(null);
          setCachedDetail(null);
        }}
        report={selectedReport}
        initialDetail={cachedDetail}
        currentUser={currentUser}
        onUpdate={() => {
          if (selectedReport?.id) invalidateReportDetailCache(selectedReport.id);
          triggerRefetch("dashboard");
        }}
      />
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        operators={users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          image: u.image,
        }))}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={pageContainerClass}
      >
        {!isReady ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-5 md:space-y-6"
          >
              <DashboardHero
                firstName={firstName}
                isEngineer={isEngineer}
                reportsToday={stats.reportsToday}
                pendingCount={stats.pendingReports}
              />

              <div className="space-y-4">
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
                <BirthdayWidget users={users} />
              </div>

              {/* ── Pending Alerts ─────────────────────────── */}
              {stats.pendingReports > 0 && (
                <div className="w-full">
                  <Card className="overflow-hidden rounded-sm border border-border/60 bg-card shadow-sm">
                    <CardHeader className="border-b border-border/50 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-muted-foreground" />
                        Reportes Pendientes ({stats.pendingReports})
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Requieren atención inmediata
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3 pb-4 px-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentReports
                          .filter(r => r.status === 'pending')
                          .slice(0, 3)
                          .map(report => (
                            <div
                              key={report.id}
                              role="button"
                              tabIndex={0}
                              onMouseEnter={() => prefetchReportDetail(report.id)}
                              onClick={() => openReport(report)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openReport(report);
                                }
                              }}
                              className="flex cursor-pointer flex-col justify-between gap-2 rounded-sm border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-semibold text-foreground">{report.problemDescription}</p>
                                <p className="mt-1 truncate text-[10px] text-muted-foreground">{report.operatorName} · {report.priority}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-8 w-full text-xs font-medium text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                              >
                                Ver detalles <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3 xl:gap-5">
                {/* ── Left Column: Reports & Trends ── */}
                <div className="flex flex-col gap-4 xl:col-span-2">
                  
                  {/* Weekly Trend (Engineers only) */}
                  {isEngineer && (
                    <DashboardSectionCard
                      title="Tendencia semanal"
                      description="Reportes generados en los últimos 7 días"
                      icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                      contentClassName="p-4 md:p-5"
                    >
                      <div className="flex h-[220px] w-full flex-col justify-between">
                        <WeeklyTrendChart loading={false} chartData={chartData} />
                      </div>
                    </DashboardSectionCard>
                  )}

                  <DashboardSectionCard
                    title="Últimos reportes"
                    description="Incidencias recientes del equipo"
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                    action={
                      <Link href="/reportes">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Ver todos
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    }
                  >
                    {recentReports.length > 0 ? (
                      <ul>
                        {recentReports.map((report) => (
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
                  </DashboardSectionCard>
                </div>

                {/* ── Right Column: Widgets ── */}
                <div className="flex flex-col gap-4 xl:col-span-1">
                  
                  <BitcentralWidget users={users} />

                  <Card className="overflow-hidden rounded-sm border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
                    <CardContent className="p-4 md:p-5">
                      <div className="mb-3 flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
                            wa?.success
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {wa?.success ? (
                            <Wifi className="h-4 w-4" />
                          ) : (
                            <WifiOff className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {wa?.success
                              ? "Conectado"
                              : wa
                                ? "Desconectado"
                                : "Sin configurar"}
                          </p>
                        </div>
                        {wa?.success && (
                          <span className="shrink-0 rounded-sm bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            Activo
                          </span>
                        )}
                      </div>

                      {wa?.data && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          <div className="rounded-sm border border-border/50 bg-muted/20 px-3 py-2">
                            <p className="text-[10px] text-muted-foreground">Mensajes hoy</p>
                            <p className="text-lg font-semibold tabular-nums text-foreground">
                              {wa.data.messagesSent || 0}
                            </p>
                          </div>
                          <div className="rounded-sm border border-border/50 bg-muted/20 px-3 py-2">
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
                            <div className="col-span-2 rounded-sm border border-amber-500/20 bg-amber-500/5 px-3 py-2">
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
                        className="h-9 w-full gap-2 rounded-sm border-border/60 text-xs font-medium"
                        onClick={() => setReminderModalOpen(true)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar recordatorio manual
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="overflow-hidden rounded-sm border border-border/60 bg-card shadow-sm">
                    <LiveActivityCard
                      comments={comments}
                      loading={false}
                      onReportClick={(reportId, hint) => openReportById(reportId, hint)}
                    />
                  </div>
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
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm bg-muted/50 ring-1 ring-border/60">
        <Activity className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-foreground/90">No hay reportes recientes</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Cuando se registren incidencias, aparecerán aquí. También puedes ver el
        historial completo en Reportes.
      </p>
      <Button
        asChild
        className="mt-6 rounded-sm bg-[#FF0C60] font-semibold text-white shadow-md hover:bg-[#E00A54]"
      >
        <Link href="/crear-reporte">Crear reporte</Link>
      </Button>
    </div>
  );
}
