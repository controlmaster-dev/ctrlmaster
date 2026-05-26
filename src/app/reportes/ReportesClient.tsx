"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { ReportesSkeleton } from "@/components/skeletons/ReportesSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  FileText,
  CheckCircle2,
  Mail,
  Send,
  MessageSquare,
  ThumbsUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  BarChart3,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { generateReportPDF } from "@/utils/pdfGenerator";
import { ProcessingModal } from "@/components/ProcessingModal";
import { EmailSendModal } from "@/components/EmailSendModal";
import { SuccessModal } from "@/components/SuccessModal";

import Link from "next/link";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReportDetailModal } from "@/components/ReportDetailModal";

interface Report {
  id: string;
  problemDescription: string;
  operatorName: string;
  operatorEmail: string;
  category: string;
  status: string;
  priority: string;
  dateStarted: string;
  dateResolved?: string | null;
  createdAt: string;
  emailStatus?: string;
  _count?: { comments: number; reactions: number };
}

export function ReportesClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Server-side state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
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

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Operator stats
  const [showStats, setShowStats] = useState(false);
  const [operatorStats, setOperatorStats] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });
  const [initialLoad, setInitialLoad] = useState(true);

  // Build query params
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (operatorFilter !== 'all') params.set('operator', operatorFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params.toString();
  }, [page, search, statusFilter, priorityFilter, operatorFilter, dateFrom, dateTo]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const res = await fetch(`/api/reports?${query}`);
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        // Fallback for old array format
        setReports(data);
        setTotal(data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchGlobalStats = useCallback(async () => {
    try {
      const [all, pending, resolved] = await Promise.all([
        fetch("/api/reports?limit=1").then((r) => r.json()),
        fetch("/api/reports?limit=1&status=pending").then((r) => r.json()),
        fetch("/api/reports?limit=1&status=resolved").then((r) => r.json()),
      ]);
      setGlobalStats({
        total: all.total ?? 0,
        pending: pending.total ?? 0,
        resolved: resolved.total ?? 0,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchGlobalStats();
    const savedUser = localStorage.getItem("enlace-user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, [page, statusFilter, priorityFilter, operatorFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Handle direct report link (?reportId=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("reportId");
    if (reportId) {
      fetch(`/api/reports/${reportId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSelectedReport(data);
            setDetailModalOpen(true);
            // Clean up URL to avoid reopening on refresh/back
            window.history.replaceState({}, '', window.location.pathname);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchReports();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch operator stats
  const fetchOperatorStats = async () => {
    try {
      const res = await fetch('/api/reports?limit=500');
      const data = await res.json();
      if (data.reports) {
        const stats: Record<string, any> = {};
        data.reports.forEach((r: Report) => {
          if (!stats[r.operatorName]) {
            stats[r.operatorName] = {
              name: r.operatorName,
              total: 0,
              pending: 0,
              resolved: 0,
              emailSent: 0,
            };
          }
          stats[r.operatorName].total++;
          if (r.status === 'pending') stats[r.operatorName].pending++;
          if (r.status === 'resolved') stats[r.operatorName].resolved++;
          if (r.emailStatus === 'sent') stats[r.operatorName].emailSent++;
        });
        setOperatorStats(Object.values(stats).sort((a: any, b: any) => b.total - a.total));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['ID', 'Operador', 'Email', 'Descripción', 'Categoría', 'Prioridad', 'Estado', 'Fecha Inicio', 'Fecha Resolución', 'Email Enviado'];
    const rows = reports.map(r => [
      r.id.slice(0, 8),
      r.operatorName,
      r.operatorEmail,
      `"${r.problemDescription.replace(/"/g, '""')}"`,
      r.category,
      r.priority,
      r.status,
      new Date(r.dateStarted).toLocaleString('es-CR'),
      r.dateResolved ? new Date(r.dateResolved).toLocaleString('es-CR') : 'Pendiente',
      r.emailStatus === 'sent' ? 'Sí' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reportes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = (report: Report) => {
    setSelectedReport(report);
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
        fetchReports();
        fetchGlobalStats();
      } else throw new Error("Error al actualizar");
    } catch (error) {
      setModal({ isOpen: true, type: "error", message: "Error de servidor." });
    }
  };

  const executeAction = async (report: Report, type: string, recipients: any) => {
    let title = "";
    let message = "";
    if (type === "download") { title = "Generando PDF"; message = "Preparando descarga..."; }
    if (type === "email") { title = "Enviando Correo"; message = "Contactando servidor de correo..."; }
    if (type === "both") { title = "Procesando"; message = "Generando PDF y enviando notificación..."; }

    setProcessing({ isOpen: true, title, message });
    try {
      const download = type === "download" || type === "both";
      const email = type === "email" || type === "both";
      await new Promise((r) => setTimeout(r, 1200));
      const res = await generateReportPDF(report, { download, email, recipients } as any) as any;
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      if (res?.success) {
        setModal({ isOpen: true, type: "success", message: "¡Listo!" });
        if (email) fetchReports();
      } else {
        setModal({ isOpen: true, type: "error", message: res?.message || "Error" });
      }
    } catch {
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      setModal({ isOpen: true, type: "error", message: "Hubo un error al procesar." });
    }
  };

  const handleAction = async (report: Report, type: "email" | "both" | "download") => {
    if (type === "download") { executeAction(report, type, undefined); return; }
    setEmailModal({ isOpen: true, report, type });
  };

  const handleEmailConfirm = (recipients: string[]) => {
    if (emailModal.report) {
      executeAction(emailModal.report, emailModal.type, recipients);
    }
  };

  const getStatusBadge = (status: string) => {
    const base =
      "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium";
    switch (status) {
      case "resolved":
        return (
          <span className={`${base} border-emerald-500/25 bg-emerald-500/10 text-emerald-500`}>
            <CheckCircle2 className="h-3 w-3" /> Resuelto
          </span>
        );
      case "pending":
        return (
          <span className={`${base} border-amber-500/25 bg-amber-500/10 text-amber-500`}>
            <Clock className="h-3 w-3" /> Pendiente
          </span>
        );
      default:
        return (
          <span className={`${base} border-border text-muted-foreground`}>Desconocido</span>
        );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setOperatorFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || operatorFilter !== 'all' || dateFrom || dateTo;

  const uniqueOperators = Array.from(
    new Set(reports.map((r) => r.operatorName).filter(Boolean))
  ).sort();

  if (initialLoad && loading) return <ReportesSkeleton />;

  return (
    <div className="relative min-h-screen overflow-hidden pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#FF0C60]/6 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl" />
      </div>
      <ReportDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        currentUser={currentUser}
        onUpdate={fetchReports}
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
        title={
          emailModal.type === "both" ? "Enviar y Descargar" : "Enviar Reporte"
        }
      />

      <div className="relative z-10 mx-auto max-w-[1600px] space-y-6 p-4 pt-20 md:space-y-8 md:p-8 md:pt-8">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Panel de <span className="text-[#FF0C60]">Incidencias</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Gestión y monitoreo de reportes técnicos
            </p>
          </div>
          <Link href="/crear-reporte" className="shrink-0">
            <Button
              size="sm"
              className="h-9 gap-2 rounded-lg bg-[#FF0C60] px-4 text-white shadow-[0_0_20px_rgba(255,12,96,0.25)] hover:bg-[#E00A54]"
            >
              <Plus className="h-4 w-4" />
              Nuevo Reporte
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatsCard
            title="Total"
            value={globalStats.total}
            subtitle="En el sistema"
            icon={<FileText className="h-5 w-5" />}
            variant="default"
          />
          <StatsCard
            title="Pendientes"
            value={globalStats.pending}
            subtitle="Por revisar"
            icon={<Clock className="h-5 w-5" />}
            variant="danger"
            valueColor="text-rose-500"
          />
          <StatsCard
            title="Resueltos"
            value={globalStats.resolved}
            subtitle="Cerrados"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
            valueColor="text-emerald-500"
          />
        </div>

        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, operador o descripción…"
                className="h-10 rounded-lg border-border/60 bg-muted/30 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 bg-muted/25 p-0.5">
                {["all", "Enlace", "EJTV", "Enlace USA"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setPriorityFilter(filter);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      priorityFilter === filter
                        ? "bg-[#FF0C60] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter === "all" ? "Todos" : filter}
                  </button>
                ))}
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[140px] rounded-lg border-border/60 bg-muted/30 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier estado</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/60"
                onClick={() => setShowFilters(!showFilters)}
                title="Más filtros"
              >
                <Filter className={`h-4 w-4 ${hasActiveFilters ? "text-[#FF0C60]" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/60"
                onClick={() => {
                  setShowStats(!showStats);
                  if (!showStats) fetchOperatorStats();
                }}
                title="Estadísticas"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/60"
                onClick={exportToCSV}
                title="Exportar CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/50 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Operador</label>
                <Select
                  value={operatorFilter}
                  onValueChange={(v) => {
                    setOperatorFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-lg border-border/60 bg-muted/30 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueOperators.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-lg border-border/60 bg-muted/30 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-lg border-border/60 bg-muted/30 text-xs"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 w-full text-xs text-muted-foreground"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </Card>

        {showStats && operatorStats.length > 0 && (
          <Card className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-[#FF0C60]" />
              Por operador
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operatorStats.map((op: { name: string; total: number; pending: number; resolved: number; emailSent: number }, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/50 bg-muted/15 p-3"
                >
                  <p className="mb-2 truncate text-sm font-medium">{op.name}</p>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                    <div>
                      <p className="text-base font-semibold tabular-nums">{op.total}</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold tabular-nums text-amber-600">
                        {op.pending}
                      </p>
                      <p className="text-muted-foreground">Pend.</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold tabular-nums text-emerald-600">
                        {op.resolved}
                      </p>
                      <p className="text-muted-foreground">Res.</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold tabular-nums">{op.emailSent}</p>
                      <p className="text-muted-foreground">Mail</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-border/60 bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 pl-4 text-xs font-medium text-muted-foreground">
                      Incidencia
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                      Categoría
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                      Actividad
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                      Prioridad
                    </TableHead>
                    <TableHead className="h-11 pr-4 text-right text-xs font-medium text-muted-foreground">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="group cursor-pointer border-border/40 transition-colors hover:bg-muted/20"
                      onClick={() => handleRowClick(report)}
                    >
                      <TableCell className="py-3.5 pl-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              #{report.id.slice(0, 6)}
                            </span>
                            <span className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-[#FF0C60]">
                              {report.problemDescription}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {report.operatorName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-muted-foreground">
                        {report.category}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-1.5">
                          {getStatusBadge(report.status)}
                          {report.emailStatus && report.emailStatus !== "none" && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ${
                                report.emailStatus === "sent"
                                  ? "text-blue-500"
                                  : report.emailStatus === "pending"
                                  ? "text-amber-500"
                                  : report.emailStatus === "error"
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Mail className="h-3 w-3" />
                              {report.emailStatus === "sent"
                                ? "Enviado"
                                : report.emailStatus === "pending"
                                ? "Pendiente"
                                : report.emailStatus === "error"
                                ? "Error"
                                : "No enviado"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          {(report._count?.comments || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs" title="Comentarios">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                              {report._count?.comments}
                            </span>
                          )}
                          {(report._count?.reactions || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs" title="Reacciones">
                              <ThumbsUp className="h-3.5 w-3.5 text-[#FF0C60]" />
                              {report._count?.reactions}
                            </span>
                          )}
                          {!(report._count?.comments || 0) && !(report._count?.reactions || 0) && (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-muted-foreground">
                        {report.priority}
                      </TableCell>
                      <TableCell
                        className="py-3.5 pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            {report.status !== "resolved" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleResolve(report.id, e)}
                                    className="w-9 h-9 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-md transition-all shadow-lg hover:shadow-emerald-500/20"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-emerald-500 border-none font-bold text-white">
                                  <p>RESOLVER</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            <div className="w-px h-5 bg-border mx-1" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(report, "download");
                                  }}
                                  className="w-9 h-9 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-cyan-500 border-none font-bold text-white">
                                <p>DESCARGAR PDF</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(report, "email");
                                  }}
                                  className="w-9 h-9 text-muted-foreground hover:text-violet-400 hover:bg-violet-400/10 rounded-md transition-colors"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-violet-500 border-none font-bold text-white">
                                <p>ENVIAR CORREO</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(report, "both");
                                  }}
                                  className="w-9 h-9 text-muted-foreground hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 rounded-md transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#FF0C60] border-none font-bold text-white">
                                <p>ENVIAR + DESCARGAR</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {reports.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">Sin resultados</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prueba con otros filtros o crea un reporte nuevo.
                </p>
              </div>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {reports.length} de {total} reportes (página {page} de {totalPages})
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-3 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`h-9 w-9 text-xs ${page === pageNum ? 'bg-[#FF0C60] hover:bg-[#FF0C60]' : ''}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-9 px-3 text-xs"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

        <Card className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Historial de correos
          </h2>
          <EmailHistoryCard />
        </Card>
      </div>
    </div>
  );
}

function EmailHistoryCard() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resend/history")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.data)) setEmails(data.data.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-sm text-muted-foreground">Cargando historial…</p>;

  if (emails.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No hay correos enviados recientemente.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <Table>
        <TableHeader className="border-b border-border/60 bg-muted/20">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 pl-4 text-xs font-medium text-muted-foreground">
              Asunto
            </TableHead>
            <TableHead className="h-10 text-xs font-medium text-muted-foreground">
              Destinatario
            </TableHead>
            <TableHead className="h-10 text-xs font-medium text-muted-foreground">
              Fecha
            </TableHead>
            <TableHead className="h-10 pr-4 text-right text-xs font-medium text-muted-foreground">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow
              key={email.id}
              className="border-border/40 hover:bg-muted/20"
            >
              <TableCell className="py-3 pl-4 text-sm font-medium">
                {email.subject}
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {Array.isArray(email.to) ? email.to.join(", ") : email.to}
              </TableCell>
              <TableCell className="py-3 text-xs text-muted-foreground">
                {new Date(email.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="py-3 pr-4 text-right">
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        email.last_event === "delivered"
                          ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                          : ""
                      }
                      ${
                        email.last_event === "sent"
                          ? "text-blue-500 border-blue-500/20 bg-blue-500/10"
                          : ""
                      }
                      ${
                        !["delivered", "sent"].includes(email.last_event)
                          ? "text-muted-foreground border-border"
                          : ""
                      }
                    `}
                  >
                    {email.last_event === "delivered"
                      ? "Entregado"
                      : email.last_event === "sent"
                      ? "Enviado"
                      : email.last_event}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}