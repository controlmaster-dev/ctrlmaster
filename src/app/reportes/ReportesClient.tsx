"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  MessageSquare,
  ThumbsUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  BarChart3,
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
import { motion } from "framer-motion";

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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const savedUser = localStorage.getItem("enlace-user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, [page, statusFilter, priorityFilter, operatorFilter, dateFrom, dateTo]);

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
    switch (status) {
      case "resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 rounded-md"><CheckCircle2 className="w-3 h-3 mr-1" /> Resuelto</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 rounded-md"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-border rounded-md">Desconocido</Badge>;
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

  if (loading)
    return (
      <div className="min-h-screen bg-background pb-20 pt-20 md:pt-6 px-6 md:px-12 max-w-[1600px] mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64 rounded-md" />
            <Skeleton className="h-6 w-96 rounded-md" />
          </div>
          <Skeleton className="h-12 w-48 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
        <div className="w-full h-16 rounded-md bg-muted/20 animate-pulse" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-t-sm" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen text-foreground pb-20 selection:bg-[#FF0C60] selection:text-white relative overflow-hidden">
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

      <div className="relative z-10 pt-20 pb-6 md:pt-6 md:pb-12 px-4 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
              Panel de <span className="text-[#FF0C60]">Incidencias</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium border-l-2 border-[#FF0C60]/20 pl-4 tracking-tight">
              Gestión y monitoreo de reportes técnicos
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-[#FF0C60]/20 rounded-md blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <Link href="/crear-reporte">
              <Button className="w-full md:w-auto h-12 md:h-14 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] hover:from-[#FF2E75] hover:to-[#FF1A8C] text-white rounded-md border-0 shadow-lg shadow-rose-500/20 gap-3 text-base md:text-lg font-semibold tracking-tight transition-all hover:scale-[1.05] active:scale-95 px-8">
                <Plus className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
                <span>Nuevo Reporte</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12 text-center">
          {[
            {
              label: "Total",
              value: reports.length,
              icon: FileText,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Pendientes",
              value: reports.filter((r) => r.status === "pending").length,
              icon: Clock,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
            },
            {
              label: "Resueltos",
              value: reports.filter((r) => r.status === "resolved").length,
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
          ].map((kpi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 md:p-6 rounded-md bg-card border border-border relative overflow-hidden group ring-1 ring-border ${
                idx === 2 ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 ${kpi.bg}`} />
              <div className="relative z-10 flex flex-col items-start px-2">
                <div className={`w-12 h-12 rounded-md ${kpi.bg} mb-4 flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <span className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-1">
                  {kpi.value}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground tracking-tight">
                  {kpi.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 md:mb-8"
        >
          {/* Main filter bar */}
          <div className="bg-card backdrop-blur-md border border-border rounded-md p-3 flex flex-col md:flex-row gap-4 items-center ring-1 ring-border">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#FF0C60] transition-colors" />
              <Input
                placeholder="Buscar por ID, operador o descripción..."
                className="pl-12 h-12 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 text-xs font-medium tracking-tight"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 w-12 shrink-0 ${hasActiveFilters ? 'text-[#FF0C60] bg-[#FF0C60]/10' : 'text-muted-foreground'}`}
            >
              <Filter className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowStats(!showStats); if (!showStats) fetchOperatorStats(); }}
              className="h-12 w-12 shrink-0 text-muted-foreground"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={exportToCSV}
              className="h-12 w-12 shrink-0 text-muted-foreground"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Quick filters */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/20 rounded-md shrink-0">
              {["all", "Enlace", "EJTV", "Enlace USA"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setPriorityFilter(filter); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-[10px] font-semibold tracking-tight transition-all ${
                    priorityFilter === filter
                      ? "bg-[#FF0C60] text-white shadow-lg shadow-rose-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {filter === "all" ? "Todos" : filter}
                </button>
              ))}
            </div>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-12 border-none bg-transparent text-muted-foreground font-semibold text-[10px] tracking-tight focus:ring-0 shrink-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground rounded-md">
                <SelectItem value="all" className="text-[10px] font-semibold tracking-tight">Cualquier estado</SelectItem>
                <SelectItem value="pending" className="text-[10px] font-semibold tracking-tight text-rose-500">Pendientes</SelectItem>
                <SelectItem value="resolved" className="text-[10px] font-semibold tracking-tight text-emerald-500">Resueltos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-card backdrop-blur-md border border-border rounded-md p-4 ring-1 ring-border"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operador</label>
                  <Select value={operatorFilter} onValueChange={(v) => { setOperatorFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-10 bg-transparent border-border text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los operadores</SelectItem>
                      <SelectItem value="Gabriel">Gabriel</SelectItem>
                      <SelectItem value="Diego">Diego</SelectItem>
                      <SelectItem value="Alex">Alex</SelectItem>
                      <SelectItem value="Andres">Andres</SelectItem>
                      <SelectItem value="Josue">Josue</SelectItem>
                      <SelectItem value="Jeremy">Jeremy</SelectItem>
                      <SelectItem value="Ronald">Ronald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Desde</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="h-10 bg-transparent border-border text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Hasta</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="h-10 bg-transparent border-border text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-10 text-xs text-muted-foreground w-full"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Operator Stats */}
        {showStats && operatorStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-card backdrop-blur-md border border-border rounded-md p-6 ring-1 ring-border"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FF0C60]" />
              Estadísticas por Operador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operatorStats.map((op: any, idx: number) => (
                <div key={idx} className="p-4 rounded-md bg-muted/20 border border-border">
                  <div className="font-semibold text-foreground text-sm mb-2">{op.name}</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div>
                      <div className="text-lg font-bold text-foreground">{op.total}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-500">{op.pending}</div>
                      <div className="text-muted-foreground">Pendiente</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-500">{op.resolved}</div>
                      <div className="text-muted-foreground">Resuelto</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-500">{op.emailSent}</div>
                      <div className="text-muted-foreground">Email</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card backdrop-blur-xl border border-border overflow-hidden rounded-md ring-1 ring-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight pl-8 h-12">
                      Incidencia
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight h-12">
                      Categoría
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight h-12">
                      Estado
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight h-12">
                      Actividad
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight h-12">
                      Prioridad
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold text-[10px] tracking-tight pr-8 h-12">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="border-border group hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(report)}
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-semibold text-muted-foreground/60 tracking-tighter bg-muted/30 px-2 py-0.5 rounded border border-border">
                              #{report.id.slice(0, 6)}
                            </span>
                            <span className="text-foreground font-semibold text-sm tracking-tight group-hover:text-[#FF0C60] transition-colors">
                              {report.problemDescription.length > 50
                                ? `${report.problemDescription.slice(0, 50)}...`
                                : report.problemDescription}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground font-bold border border-border">
                              {report.operatorName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground tracking-tight">
                              {report.operatorName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="text-xs text-foreground font-medium tracking-tight">
                          {report.category}
                        </span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col gap-2 items-start">
                          <div className="scale-90 origin-left">
                            {getStatusBadge(report.status)}
                          </div>
                          {report.emailStatus && (
                            <Badge
                              variant="outline"
                              className={`scale-90 origin-left border-dashed
                                ${
                                  report.emailStatus === "sent"
                                    ? "text-blue-500 border-blue-500/30"
                                    : ""
                                }
                                ${
                                  report.emailStatus === "pending"
                                    ? "text-amber-500 border-amber-500/30"
                                    : ""
                                }
                                ${
                                  report.emailStatus === "error"
                                    ? "text-red-500 border-red-500/30"
                                    : ""
                                }
                                ${
                                  !report.emailStatus ||
                                  report.emailStatus === "none"
                                    ? "text-muted-foreground border-border bg-muted/30"
                                    : ""
                                }
                              `}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              {report.emailStatus === "sent"
                                ? "Enviado"
                                : report.emailStatus === "pending"
                                ? "Pendiente"
                                : report.emailStatus === "error"
                                ? "Error"
                                : "No Enviado"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2">
                          {((report._count?.comments || 0) > 0) && (
                            <div
                              className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
                              title="Comentarios"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                          )}
                          {((report._count?.reactions || 0) > 0) && (
                            <div
                              className="w-8 h-8 rounded-md bg-[#FF0C60]/10 border border-[#FF0C60]/20 flex items-center justify-center"
                              title="Reacciones"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-[#FF0C60]" />
                            </div>
                          )}
                          {!(report._count?.comments || 0) && !(report._count?.reactions || 0) && (
                            <span className="text-muted-foreground/30 font-medium">
                              -
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge
                          variant="outline"
                          className={`bg-muted/30 text-[9px] font-semibold tracking-tight border-border rounded px-3 py-1 ${
                            report.priority === "Enlace"
                              ? "text-indigo-400 border-indigo-500/30"
                              : report.priority === "EJTV"
                              ? "text-[#FF0C60] border-[#FF0C60]/30"
                              : ""
                          }`}
                        >
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="pr-10 py-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <CheckCircle className="w-4 h-4" />
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
            {reports.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-border border-dashed ring-8 ring-muted/5">
                  <Zap className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-foreground/50 tracking-tight">
                  Sin resultados
                </h3>
                <p className="text-muted-foreground font-semibold text-xs mt-2 tracking-normal">
                  No se encontraron reportes que coincidan con los filtros
                </p>
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 mb-20 bg-card/10 p-6 md:p-10 rounded-md border border-border border-dashed"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-8 bg-[#FF0C60] rounded-full" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Historial de Notificaciones
            </h2>
          </div>
          <EmailHistoryCard />
        </motion.div>
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
    return <div className="text-slate-500 text-sm">Cargando historial...</div>;

  if (emails.length === 0)
    return (
      <Card className="bg-card/50 backdrop-blur-xl border border-border p-8 text-center rounded-md">
        <p className="text-muted-foreground">
          No hay registros de correos enviados recientemente.
        </p>
      </Card>
    );

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border overflow-hidden rounded-md ring-1 ring-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight pl-6">
                Asunto
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight">
                Destinatario
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold text-[10px] tracking-tight">
                Fecha
              </TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold text-[10px] tracking-tight pr-6">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow
                key={email.id}
                className="border-border hover:bg-muted/20 transition-colors"
              >
                <TableCell className="pl-6 py-4 text-foreground font-medium">
                  {email.subject}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm">
                  {Array.isArray(email.to) ? email.to.join(", ") : email.to}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-xs">
                  {new Date(email.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="py-4 pr-6 text-right">
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
    </Card>
  );
}