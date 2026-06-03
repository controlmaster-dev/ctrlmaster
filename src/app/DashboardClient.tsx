"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Activity,
  Cake,
} from "lucide-react";
import type { Report } from "@/types/report";
import type { ReportDetail } from "@/components/ReportDetailModal";

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
import { DashboardRecentReports } from "@/components/dashboard/DashboardRecentReports";
import {
  DashboardWhatsappCard,
  type WhatsappHealth,
} from "@/components/dashboard/DashboardWhatsappCard";
import { LiveActivityCard } from "@/components/dashboard/LiveActivityCard";
import { DashboardWeeklyTrendCard } from "@/components/dashboard/DashboardWeeklyTrendCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { BentoCard } from "@/components/dashboard/BentoCard";
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
  const [cachedDetail, setCachedDetail] = useState<ReportDetail | null>(null);

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
    setCachedDetail((cached as ReportDetail | null) ?? null);
    setDetailModalOpen(true);
    if (!cached) {
      prefetchReportDetail(report.id).then((data) => {
        if (data) setCachedDetail(data as ReportDetail);
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
      setCachedDetail((cached as ReportDetail | null) ?? null);
      setDetailModalOpen(true);
      if (!cached) {
        prefetchReportDetail(reportId).then((data) => {
          if (data) setCachedDetail(data as ReportDetail);
        });
      }
    },
    [recentReports]
  );

  const firstName = currentUser?.name?.trim()?.split(/\s+/)[0];
  const isEngineer = currentUser?.role === "ENGINEER";
  const wa = whatsappHealth as WhatsappHealth;


  return (
    <div className="dashboard-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-brand selection:text-white">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-foreground/[0.02] blur-3xl" />
      </div>


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

            <DashboardHero
              firstName={firstName}
              isEngineer={isEngineer}
              reportsToday={stats.reportsToday}
              pendingCount={stats.pendingReports}
            />


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


            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">


              <div className="flex flex-col gap-4 xl:col-span-2">
                <DashboardRecentReports
                  pendingCount={stats.pendingReports}
                  reports={recentReports}
                  onResolve={handleResolve}
                  onOpen={openReport}
                />
              </div>


              <div className="flex flex-col">
                <BitcentralWidget users={users} className="h-full" />
              </div>


              {isEngineer && (
                <div className="flex flex-col xl:col-span-2">
                  <DashboardWeeklyTrendCard chartData={chartData} />
                </div>
              )}


              <div className={cn("flex flex-col", !isEngineer ? "xl:col-span-2" : "xl:col-span-1")}>
                <BirthdayWidget users={users} className="h-full" />
              </div>


              <div className={cn("flex flex-col", isEngineer ? "xl:col-span-2" : "xl:col-span-1")}>
                <BentoCard variant="default" className="h-full">
                  <LiveActivityCard
                    comments={comments}
                    loading={false}
                    onReportClick={(reportId, hint) => openReportById(reportId, hint)}
                  />
                </BentoCard>
              </div>


              <div className={cn("flex flex-col", !isEngineer ? "xl:col-span-3" : "xl:col-span-1")}>
                <DashboardWhatsappCard
                  health={wa}
                  onOpenReminder={() => setReminderModalOpen(true)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

