"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Plus,
  Activity,
  ArrowUpRight,
  FileText,
  Users as UsersIcon,
  MonitorPlay,
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
import { useRouter } from "next/navigation";
import { ProcessingModal } from "@/components/ProcessingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { ReminderModal } from "@/components/ReminderModal";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { LiveActivityCard } from "@/components/dashboard/LiveActivityCard";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { STATUS_COLORS, STATUS_LABELS } from "@/config/constants";
import { pageContainerClass } from "@/lib/page-layout";

import {
  useDashboardStats,
  useUsers,
  useRecentComments,
  useBirthdayNotifications,
  useCurrentUser,
  useResolveReport,
} from "@/hooks/useDashboardData";

// ─── Lazy-loaded heavy components ─────────────────────────────────────────────

const BitcentralWidget = dynamic(
  () =>
    import("@/components/BitcentralWidget").then((mod) => mod.BitcentralWidget),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
    ssr: false,
  }
);

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
}: {
  report: Report;
  onResolve: (id: string, e: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const createdLabel =
    report.createdAt &&
    formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });

  return (
    <li className="border-b border-border/40 last:border-0">
      <div
        role="button"
        tabIndex={0}
        className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        onClick={() => router.push(`/reportes?reportId=${report.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/reportes?reportId=${report.id}`);
          }
        }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {reportInitials(report.operatorName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {report.problemDescription}
            </p>
            <Badge
              variant="outline"
              className={`shrink-0 border px-2 py-0 text-[10px] font-medium ${STATUS_COLORS[report.status] ?? ""}`}
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

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const currentUser = useCurrentUser();
  const { stats, recentReports, chartData, isLoading: isLoadingReports } = useDashboardStats();
  const { users, isLoading: isLoadingUsers } = useUsers();
  const { comments, isLoading: isLoadingComments } = useRecentComments();

  // ── WhatsApp health ────────────────────────────────────────────────────────
  const [whatsappHealth, setWhatsappHealth] = useState<any>(null);
  const [isLoadingWA, setIsLoadingWA] = useState(true);

  const checkWhatsAppHealth = useCallback(async () => {
    try {
      // Use server-side proxy to avoid CORS issues
      const res = await fetch('/api/proxy/whatsapp');
      const data = await res.json();
      if (data.success) {
        setWhatsappHealth(data);
      } else {
        setWhatsappHealth(null);
      }
    } catch {
      setWhatsappHealth(null);
    } finally {
      setIsLoadingWA(false);
    }
  }, []);

  useEffect(() => {
    checkWhatsAppHealth();

    // Refresh every 60s
    const interval = setInterval(checkWhatsAppHealth, 60000);
    return () => clearInterval(interval);
  }, [checkWhatsAppHealth]);

  // ── Side effects ───────────────────────────────────────────────────────────
  useBirthdayNotifications(users, isLoadingUsers);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleResolveSuccess = useCallback((msg: string) => {
    setSuccessModal({ isOpen: true, type: "success", message: msg });
  }, []);

  const handleResolveError = useCallback((msg: string) => {
    setSuccessModal({ isOpen: true, type: "error", message: msg });
  }, []);

  const handleResolve = useResolveReport(handleResolveSuccess, handleResolveError);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isPageLoading = isLoadingReports || isLoadingUsers;
  const [hasHydratedOnce, setHasHydratedOnce] = useState(false);
  const firstName = currentUser?.name?.trim()?.split(/\s+/)[0];
  const isEngineer = currentUser?.role === "ENGINEER";

  // Only show the full-page skeleton on first load.
  useEffect(() => {
    if (!hasHydratedOnce && !isPageLoading) setHasHydratedOnce(true);
  }, [hasHydratedOnce, isPageLoading]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#FF0C60]/6 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl" />
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
        {!hasHydratedOnce && isPageLoading ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6 md:space-y-8"
          >
              <header className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  {firstName && (
                    <p className="text-sm text-muted-foreground">
                      Hola, <span className="font-medium text-foreground">{firstName}</span>
                    </p>
                  )}
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                    {isEngineer ? (
                      <>
                        Ingeniería{" "}
                        <span className="text-violet-500">Master</span>
                      </>
                    ) : (
                      <>
                        Control <span className="text-[#FF0C60]">Master</span>
                      </>
                    )}
                  </h1>
                  <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                    Resumen del día: reportes, monitoreo y equipo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Link href="/operadores/monitoreo">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 rounded-lg border-border/80 bg-card/80"
                    >
                      <MonitorPlay className="h-4 w-4" />
                      Monitoreo
                    </Button>
                  </Link>
                  <Link href="/operadores">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 rounded-lg border-border/80 bg-card/80"
                    >
                      <UsersIcon className="h-4 w-4" />
                      Horarios
                    </Button>
                  </Link>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border-border/80 bg-card/80"
                          asChild
                        >
                          <a
                            href="/Manual de Control.pdf"
                            download="Manual de Control.pdf"
                            aria-label="Descargar manual"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Manual en PDF</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Link href="/crear-reporte">
                    <Button
                      size="sm"
                      className="h-9 gap-2 rounded-lg bg-[#FF0C60] px-4 text-white hover:bg-[#E00A54]"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo reporte
                    </Button>
                  </Link>
                </div>
              </header>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    valueColor="text-rose-500"
                  />
                  <StatsCard
                    title="Resueltos"
                    value={stats.resolvedReports}
                    subtitle="Cerrados"
                    icon={<CheckCircle className="h-5 w-5" />}
                    variant="success"
                    valueColor="text-emerald-500"
                  />
                </div>
                <BirthdayWidget users={users} />
              </div>

              {/* ── Pending Alerts ─────────────────────────── */}
              {stats.pendingReports > 0 && (
                <div className="w-full">
                  <Card className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/10">
                    <CardHeader className="pb-3 border-b border-amber-500/10">
                      <CardTitle className="text-base text-amber-500 flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        Reportes Pendientes ({stats.pendingReports})
                      </CardTitle>
                      <CardDescription className="text-amber-600/70 dark:text-amber-400/70 text-xs font-medium">
                        Requieren atención inmediata
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3 pb-4 px-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentReports
                          .filter(r => r.status === 'pending')
                          .slice(0, 3)
                          .map(report => (
                            <div key={report.id} className="flex flex-col justify-between p-3 rounded-xl bg-background/50 border border-amber-500/10 hover:border-amber-500/30 transition-all gap-2 shadow-sm">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground line-clamp-1">{report.problemDescription}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 truncate">{report.operatorName} · {report.priority}</p>
                              </div>
                              <Link href={`/reportes?reportId=${report.id}`} className="mt-1">
                                <Button variant="ghost" size="sm" className="w-full text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 text-xs h-8 font-medium">
                                  Ver detalles <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3 xl:gap-8">
                {/* ── Left Column: Reports & Trends ── */}
                <div className="flex flex-col gap-4 xl:col-span-2 md:gap-6">
                  
                  {/* Weekly Trend (Engineers only) */}
                  {isEngineer && (
                    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl text-foreground flex items-center gap-2 font-semibold tracking-tight">
                          <Activity className="w-5 h-5 text-purple-400" /> Tendencia semanal
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium text-xs">
                          Reportes generados en los últimos 7 días
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[220px] w-full p-4 flex flex-col justify-between relative group">
                          <WeeklyTrendChart loading={isLoadingReports} chartData={chartData} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold text-foreground">
                          Últimos reportes
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-[11px] text-muted-foreground">
                          Incidencias recientes
                        </CardDescription>
                      </div>
                      <Link href="/reportes" className="shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs font-medium text-[#FF0C60] hover:bg-[#FF0C60]/10 hover:text-[#FF0C60]"
                        >
                          Ver todos
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                      {isLoadingReports ? (
                        <ReportsListSkeleton />
                      ) : recentReports.length > 0 ? (
                        <ul>
                          {recentReports.map((report) => (
                            <ReportListItem
                              key={report.id}
                              report={report}
                              onResolve={handleResolve}
                            />
                          ))}
                        </ul>
                      ) : (
                        <EmptyReportsState />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ── Right Column: Widgets ── */}
                <div className="flex flex-col gap-4 xl:col-span-1 md:gap-6">
                  
                  {/* Bitcentral Widget */}
                  {isLoadingUsers ? (
                    <BitcentralLoadingSkeleton />
                  ) : (
                    <BitcentralWidget users={users} />
                  )}

                  <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isLoadingWA
                              ? "bg-muted"
                              : whatsappHealth?.success
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isLoadingWA ? (
                            <div className="h-4 w-4 animate-pulse rounded-full bg-muted-foreground/20" />
                          ) : whatsappHealth?.success ? (
                            <Wifi className="h-4 w-4" />
                          ) : (
                            <WifiOff className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isLoadingWA
                              ? "Verificando conexión…"
                              : whatsappHealth?.success
                                ? "Conectado"
                                : whatsappHealth
                                  ? "Desconectado"
                                  : "Sin configurar"}
                          </p>
                        </div>
                        {!isLoadingWA && whatsappHealth?.success && (
                          <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            Activo
                          </span>
                        )}
                      </div>

                      {whatsappHealth?.data && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                            <p className="text-[10px] text-muted-foreground">Mensajes hoy</p>
                            <p className="text-lg font-semibold tabular-nums text-foreground">
                              {whatsappHealth.data.messagesSent || 0}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                            <p className="text-[10px] text-muted-foreground">Errores</p>
                            <p
                              className={`text-lg font-semibold tabular-nums ${
                                whatsappHealth.data.messagesFailed > 0
                                  ? "text-red-500"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {whatsappHealth.data.messagesFailed || 0}
                            </p>
                          </div>
                          {whatsappHealth.data.queueSize > 0 && (
                            <div className="col-span-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                {whatsappHealth.data.queueSize} mensaje(s) en cola
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!whatsappHealth && !isLoadingWA && (
                        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                          Conecta la API de WhatsApp para enviar recordatorios automáticos al equipo.
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full gap-2 rounded-lg border-border/60 text-xs font-medium"
                        onClick={() => setReminderModalOpen(true)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar recordatorio manual
                      </Button>
                    </CardContent>
                  </Card>

                  <LiveActivityCard comments={comments} loading={isLoadingComments} />
                </div>
              </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Skeleton sub-components ──────────────────────────────────────────────────

function ReportsListSkeleton() {
  return (
    <div className="divide-y divide-border/40">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyReportsState() {
  return (
    <div className="py-16 px-6 text-center">
      <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/25" />
      <p className="text-foreground/80 font-semibold">No hay reportes recientes</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
        Cuando se registren incidencias, aparecerán aquí. También puedes ver el
        historial completo en Reportes.
      </p>
      <Button
        asChild
        className="mt-6 rounded-xl bg-[#FF0C60] hover:bg-[#E00A54] text-white font-semibold shadow-lg shadow-rose-500/20"
      >
        <Link href="/crear-reporte">Crear reporte</Link>
      </Button>
    </div>
  );
}

function BitcentralLoadingSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-sm overflow-hidden rounded-2xl ring-0 h-[600px] flex flex-col">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 border-l-[3px] border-transparent"
            >
              <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-1">
                <Skeleton className="h-2 w-6" />
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex-1 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}