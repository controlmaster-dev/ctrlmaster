"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileText, CheckCircle2, Clock } from "lucide-react";
import { ReportesSkeleton } from "@/components/skeletons/ReportesSkeleton";
import { ProcessingModal } from "@/components/ProcessingModal";
import { EmailSendModal } from "@/components/EmailSendModal";
import { SuccessModal } from "@/components/SuccessModal";
import { EmailHistoryCard } from "@/components/reportes/EmailHistoryCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { ReportesFiltersBar } from "@/components/reportes/ReportesFiltersBar";
import { ReportesOperatorStats } from "@/components/reportes/ReportesOperatorStats";
import { ReportesTable } from "@/components/reportes/ReportesTable";
import { pageContainerClass } from "@/lib/page-layout";
import { invalidateReportDetailCache } from "@/lib/reportDetailCache";
import { useReportesList } from "@/hooks/useReportesList";
import { useAuth } from "@/contexts/AuthContext";
import type { Report, ReportDetail } from "@/components/reportes/reportes-types";

const ReportDetailModal = dynamic(
  () => import("@/components/ReportDetailModal").then((m) => m.ReportDetailModal),
  { ssr: false }
);

export function ReportesClient() {
  const list = useReportesList();

  const [modal, setModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });
  const [processing, setProcessing] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    report: Report | null;
    type: "email" | "both";
  }>({ isOpen: false, report: null, type: "email" });

  const { user: currentUser } = useAuth();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [cachedDetail, setCachedDetail] = useState<ReportDetail | null>(null);

  useEffect(() => {
    list.openReportFromUrl((report, detail) => {
      if (report) setSelectedReport(report);
      if (detail) setCachedDetail(detail);
      setDetailModalOpen(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link once on mount
  }, []);

  const handleRowClick = (report: Report) => {
    const cached = list.openReportRow(report, (detail) => setCachedDetail(detail));
    setSelectedReport(report);
    setCachedDetail(cached);
    setDetailModalOpen(true);
  };

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", message: "Reporte marcado como resuelto." });
        list.refreshList();
      } else throw new Error("Error al actualizar");
    } catch {
      setModal({ isOpen: true, type: "error", message: "Error de servidor." });
    }
  };

  const executeAction = async (report: Report, type: string, recipients?: string[]) => {
    const titles: Record<string, { title: string; message: string }> = {
      download: { title: "Generando PDF", message: "Preparando descarga..." },
      email: { title: "Enviando Correo", message: "Contactando servidor de correo..." },
      both: { title: "Procesando", message: "Generando PDF y enviando notificación..." },
    };
    const { title, message } = titles[type] ?? titles.download;
    setProcessing({ isOpen: true, title, message });

    try {
      const download = type === "download" || type === "both";
      const email = type === "email" || type === "both";
      await new Promise((r) => setTimeout(r, 1200));
      const { generateReportPDF } = await import("@/utils/pdfGenerator");
      const res = await generateReportPDF(report, { download, email, recipients });
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      if (res?.success) {
        setModal({ isOpen: true, type: "success", message: "¡Listo!" });
        if (email) list.fetchReports();
      } else {
        setModal({ isOpen: true, type: "error", message: res?.message || "Error" });
      }
    } catch {
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      setModal({ isOpen: true, type: "error", message: "Hubo un error al procesar." });
    }
  };

  const handleAction = async (report: Report, type: "email" | "both" | "download") => {
    if (type === "download") {
      void executeAction(report, type, undefined);
      return;
    }
    setEmailModal({ isOpen: true, report, type });
  };

  const handleEmailConfirm = (recipients: string[]) => {
    if (emailModal.report) {
      void executeAction(emailModal.report, emailModal.type, recipients);
    }
  };

  if (list.initialLoad && list.loading && !list.hasListCache) {
    return <ReportesSkeleton />;
  }

  return (
    <div className="reportes-ui relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-brand selection:text-white">
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
          list.refreshList();
        }}
      />
      <ProcessingModal
        isOpen={processing.isOpen}
        title={processing.title}
        message={processing.message}
      />
      <SuccessModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.type === "success" ? "Éxito" : "Error"}
        message={modal.message}
        type={modal.type}
      />
      <EmailSendModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleEmailConfirm}
        reportId={emailModal.report?.id || ""}
        title={emailModal.type === "both" ? "Enviar y Descargar" : "Enviar Reporte"}
      />

      <div className={`${pageContainerClass} space-y-5`}>
        <BentoCard variant="default" className="p-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3 w-3" />
              Gestión de reportes
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Panel de incidencias
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Búsqueda, seguimiento y acciones sobre reportes técnicos.
              </p>
            </div>
          </div>
        </BentoCard>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatsCard
            title="Total"
            value={list.globalStats.total}
            subtitle="En el sistema"
            icon={<FileText className="h-5 w-5" />}
            variant="default"
          />
          <StatsCard
            title="Pendientes"
            value={list.globalStats.active}
            subtitle={
              list.globalStats.inProgress > 0
                ? `${list.globalStats.pending} pendientes · ${list.globalStats.inProgress} en curso`
                : "Por revisar"
            }
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="Resueltos"
            value={list.globalStats.resolved}
            subtitle="Cerrados"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
        </div>

        <ReportesFiltersBar
          search={list.search}
          onSearchChange={list.setSearch}
          statusFilter={list.statusFilter}
          onStatusFilterChange={list.setStatusFilter}
          priorityFilter={list.priorityFilter}
          onPriorityFilterChange={list.setPriorityFilter}
          operatorFilter={list.operatorFilter}
          onOperatorFilterChange={list.setOperatorFilter}
          dateFrom={list.dateFrom}
          onDateFromChange={list.setDateFrom}
          dateTo={list.dateTo}
          onDateToChange={list.setDateTo}
          showFilters={list.showFilters}
          onToggleFilters={() => list.setShowFilters(!list.showFilters)}
          showStats={list.showStats}
          onToggleStats={() => {
            const next = !list.showStats;
            list.setShowStats(next);
            if (next) void list.fetchOperatorStats();
          }}
          hasActiveFilters={list.hasActiveFilters}
          uniqueOperators={list.uniqueOperators}
          filterChip={list.filterChip}
          onClearFilters={list.clearFilters}
          onPageReset={() => list.setPage(1)}
          reports={list.reports}
        />

        {list.showStats && <ReportesOperatorStats stats={list.operatorStats} />}

        <ReportesTable
          reports={list.reports}
          loading={list.loading}
          page={list.page}
          total={list.total}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          onRowClick={handleRowClick}
          onResolve={handleResolve}
          onAction={handleAction}
        />

        <BentoCard variant="default" className="p-4">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">
            Historial de correos
          </h2>
          <EmailHistoryCard />
        </BentoCard>
      </div>
    </div>
  );
}
