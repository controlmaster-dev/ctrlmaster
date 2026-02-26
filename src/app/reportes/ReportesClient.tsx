"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Send, CheckCircle, Mail, Zap, MessageSquare, ThumbsUp, Clock, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { generateReportPDF } from "@/utils/pdfGenerator";
import { ProcessingModal } from "@/components/ProcessingModal";
import { EmailSendModal } from "@/components/EmailSendModal";
import { SuccessModal } from "@/components/SuccessModal";

import Link from "next/link";
import { motion } from "framer-motion";

import { ReportDetailModal } from "@/components/ReportDetailModal"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function ReportesClient() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [processing, setProcessing] = useState({ isOpen: false, title: "", message: "" });
  const [emailModal, setEmailModal] = useState(



    {
      isOpen: false,
      report: null,
      type: 'email'
    });

  const [currentUser, setCurrentUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        const validReports = data.filter((r) => r.operatorName !== 'Monitoreo Automático');
        setReports(validReports);
        setFilteredReports(validReports);
      } else {
        setReports([]);
        setFilteredReports([]);
      }
      if (selectedReport) {
        const updated = data.find((r) => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
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
  }, []);

  useEffect(() => {
    let filtered = reports;
    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.problemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((report) => report.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter((report) => report.priority === priorityFilter);
    if (categoryFilter !== "all") filtered = filtered.filter((report) => report.category === categoryFilter);
    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const handleRowClick = (report) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const handleResolve = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' })
      });
      if (res.ok) {
        setModal({ isOpen: true, type: 'success', message: 'Reporte marcado como resuelto.' });
        fetchReports();
      } else throw new Error("Error al actualizar");
    } catch (error) {
      setModal({ isOpen: true, type: 'error', message: 'Error de servidor.' });
    }
  };

  const executeAction = async (report, type, recipients) => {
    let title = ""; let message = "";
    if (type === 'download') { title = "Generando PDF"; message = "Preparando descarga..."; }
    if (type === 'email') { title = "Enviando Correo"; message = "Contactando servidor de correo..."; }
    if (type === 'both') { title = "Procesando"; message = "Generando PDF y enviando notificación..."; }
    setProcessing({ isOpen: true, title, message });
    try {
      const download = type === 'download' || type === 'both';
      const email = type === 'email' || type === 'both';
      await new Promise((r) => setTimeout(r, 1200));
      const res = await generateReportPDF(report, { download, email, recipients } as any);
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      if (res?.success) {
        setModal({ isOpen: true, type: 'success', message: '¡Listo!' });
        if (email) fetchReports();
      } else
        if (email && !res?.success) {
          setModal({ isOpen: true, type: 'error', message: res?.message || 'Error al enviar correo' });
          fetchReports();
        } else
          setModal({ isOpen: true, type: 'success', message: 'Operación completada.' });
    } catch (error) {
      setProcessing((prev) => ({ ...prev, isOpen: false }));
      setModal({ isOpen: true, type: 'error', message: 'Hubo un error al procesar.' });
      fetchReports();
    }
  };

  const handleAction = async (report, type) => {
    if (type === 'download') {
      executeAction(report, type, undefined);
      return;
    }
    setEmailModal({ isOpen: true, report, type });
  };

  const handleEmailConfirm = (recipients) => {
    if (emailModal.report) {
      executeAction(emailModal.report, emailModal.type, recipients);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved": return _jsxs(Badge, { className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 rounded-md", children: [_jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }), " Resuelto"] });
      case "pending": return _jsxs(Badge, { className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 rounded-md", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), " Pendiente"] });
      default: return _jsx(Badge, { variant: "outline", className: "text-muted-foreground border-border rounded-md", children: "Desconocido" });
    }
  };

  if (loading) return (
    _jsxs("div", {
      className: "min-h-screen bg-background pb-20 pt-32 px-6 md:px-12 max-w-[1600px] mx-auto space-y-12", children: [
        _jsxs("div", {
          className: "flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12", children: [
            _jsxs("div", {
              className: "space-y-2", children: [
                _jsx(Skeleton, { className: "h-12 w-64 rounded-md" }),
                _jsx(Skeleton, { className: "h-6 w-96 rounded-md" })]
            }
            ),
            _jsx(Skeleton, { className: "h-12 w-48 rounded-md" })]
        }
        ),
        _jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12", children:
            [1, 2, 3].map((i) => _jsx(Skeleton, { className: "h-40 rounded-md" }, i))
        }
        ),
        _jsx("div", { className: "w-full h-16 rounded-md bg-muted/20 animate-pulse" }),
        _jsxs("div", {
          className: "space-y-4", children: [
            _jsx(Skeleton, { className: "h-12 w-full rounded-t-sm" }),
            [1, 2, 3, 4, 5].map((i) => _jsx(Skeleton, { className: "h-16 w-full rounded-md" }, i))]
        }
        )]
    }
    ));


  return (
    _jsxs("div", {
      className: "min-h-screen text-foreground pb-20 selection:bg-[#FF0C60] selection:text-white relative overflow-hidden", children: [
        _jsx(ReportDetailModal, { isOpen: detailModalOpen, onClose: () => { setDetailModalOpen(false); setSelectedReport(null); }, report: selectedReport, currentUser: currentUser, onUpdate: fetchReports }),
        _jsx(ProcessingModal, { isOpen: processing.isOpen, title: processing.title, message: processing.message }),
        _jsx(SuccessModal, { isOpen: modal.isOpen, onClose: () => setModal({ ...modal, isOpen: false }), title: modal.type === 'success' ? 'Éxito' : 'Error', message: modal.message, type: modal.type }),
        _jsx(EmailSendModal, { isOpen: emailModal.isOpen, onClose: () => setEmailModal((prev) => ({ ...prev, isOpen: false })), onConfirm: handleEmailConfirm, reportId: emailModal.report?.id || "", title: emailModal.type === 'both' ? "Enviar y Descargar" : "Enviar Reporte" }),

        _jsxs("div", {
          className: "relative z-10 pt-20 pb-6 md:pt-32 md:pb-12 px-4 md:px-12 max-w-[1600px] mx-auto", children: [
            _jsxs("div", {
              className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12", children: [
                _jsxs(motion.div, {
                  initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, children: [
                    _jsxs("h1", { className: "text-3xl md:text-5xl font-bold text-foreground tracking-tighter mb-2", children: ["Panel de ", _jsx("span", { className: "text-[#FF0C60]", children: "Incidencias" })] }),
                    _jsx("p", { className: "text-muted-foreground text-sm md:text-base font-medium border-l-2 border-[#FF0C60]/20 pl-4 tracking-tight", children: "Gesti\xF3n y monitoreo de reportes t\xE9cnicos" })]
                }
                ),
                _jsxs(motion.div, {
                  initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "relative group", children: [
                    _jsx("div", { className: "absolute inset-0 bg-[#FF0C60]/20 rounded-md blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" }),
                    _jsx(Link, {
                      href: "/crear-reporte", children:
                        _jsxs(Button, {
                          className: "w-full md:w-auto h-12 md:h-14 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] hover:from-[#FF2E75] hover:to-[#FF1A8C] text-white rounded-md border-0 shadow-lg shadow-rose-500/20 gap-3 text-base md:text-lg font-semibold tracking-tight transition-all hover:scale-[1.05] active:scale-95 px-8", children: [
                            _jsx(Plus, { className: "w-5 h-5 md:w-6 md:h-6 stroke-[3]" }),
                            _jsx("span", { children: "Nuevo Reporte" })]
                        }
                        )
                    }
                    )]
                }
                )]
            }
            ),

            _jsx("div", {
              className: "grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12 text-center", children:
                [
                  { label: 'Total', value: reports.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Pendientes', value: reports.filter((r) => r.status === 'pending').length, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                  { label: 'Resueltos', value: reports.filter((r) => r.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }].
                  map((kpi, idx) =>
                    _jsxs(motion.div, {
                      initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: idx * 0.1 }, className: `p-4 md:p-6 rounded-md bg-card border border-border relative overflow-hidden group ring-1 ring-border ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`, children: [
                        _jsx("div", { className: `absolute top-0 right-0 p-32 ${kpi.bg} blur-3xl rounded-md opacity-20 group-hover:opacity-30 transition-opacity` }),
                        _jsxs("div", {
                          className: "relative z-10 flex flex-col items-center", children: [
                            _jsx("div", { className: `w-12 h-12 rounded-md ${kpi.bg} flex items-center justify-center mb-3 md:mb-4`, children: _jsx(kpi.icon, { className: `w-6 h-6 ${kpi.color}` }) }),
                            _jsx("span", { className: "text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-1", children: kpi.value }),
                            _jsx("span", { className: "text-[10px] md:text-xs font-medium text-muted-foreground tracking-tight", children: kpi.label })]
                        }
                        )]
                    }, idx
                    )
                  )
            }
            ),

            _jsx(motion.div, {
              initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "mb-6 md:mb-8", children:
                _jsxs("div", {
                  className: "bg-card backdrop-blur-md border border-border rounded-md p-3 flex flex-col md:flex-row gap-4 items-center ring-1 ring-border", children: [
                    _jsxs("div", {
                      className: "relative flex-1 w-full group", children: [
                        _jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#FF0C60] transition-colors" }),
                        _jsx(Input, { placeholder: "Buscar por ID, operador o descripci\xF3n...", className: "pl-12 h-12 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 text-xs font-medium tracking-tight", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })]
                    }
                    ),
                    _jsx("div", { className: "h-8 w-px bg-border hidden md:block" }),
                    _jsx("div", {
                      className: "flex items-center gap-1.5 p-1 bg-muted/20 rounded-md", children:
                        ['all', 'Enlace', 'EJTV', 'Enlace USA'].map((filter) =>
                          _jsx("button", { onClick: () => setPriorityFilter(filter), className: `px-4 py-2.5 rounded-md text-[10px] font-semibold tracking-tight transition-all ${priorityFilter === filter ? 'bg-[#FF0C60] text-white shadow-lg shadow-rose-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: filter === 'all' ? 'Ver Todos' : filter }, filter)
                        )
                    }
                    ),
                    _jsx("div", { className: "h-8 w-px bg-border hidden md:block" }),
                    _jsxs(Select, {
                      value: statusFilter, onValueChange: setStatusFilter, children: [
                        _jsx(SelectTrigger, { className: "w-[180px] h-12 border-none bg-transparent text-muted-foreground font-semibold text-[10px] tracking-tight focus:ring-0", children: _jsx(SelectValue, { placeholder: "Estado" }) }),
                        _jsxs(SelectContent, {
                          className: "bg-popover border-border text-popover-foreground rounded-md", children: [
                            _jsx(SelectItem, { value: "all", className: "text-[10px] font-semibold tracking-tight", children: "Cualquier estado" }),
                            _jsx(SelectItem, { value: "pending", className: "text-[10px] font-semibold tracking-tight text-rose-500", children: "Pendientes" }),
                            _jsx(SelectItem, { value: "resolved", className: "text-[10px] font-semibold tracking-tight text-emerald-500", children: "Resueltos" })]
                        }
                        )]
                    }
                    )]
                }
                )
            }
            ),

            _jsx(motion.div, {
              initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, children:
                _jsxs(Card, {
                  className: "bg-card backdrop-blur-xl border border-border overflow-hidden rounded-md ring-1 ring-border", children: [
                    _jsx("div", {
                      className: "overflow-x-auto", children:
                        _jsxs(Table, {
                          children: [
                            _jsx(TableHeader, {
                              className: "bg-muted/10", children:
                                _jsxs(TableRow, {
                                  className: "border-border hover:bg-transparent", children: [
                                    _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight pl-8 h-12", children: "Incidencia" }),
                                    _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight h-12", children: "Categor\xEDa" }),
                                    _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight h-12", children: "Estado" }),
                                    _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight h-12", children: "Actividad" }),
                                    _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight h-12", children: "Prioridad" }),
                                    _jsx(TableHead, { className: "text-right text-muted-foreground font-semibold text-[10px] tracking-tight pr-8 h-12", children: "Acciones" })]
                                }
                                )
                            }
                            ),
                            _jsx(TableBody, {
                              children:
                                filteredReports.map((report) =>
                                  _jsxs(TableRow, {
                                    className: "border-border group hover:bg-muted/10 transition-colors cursor-pointer", onClick: () => handleRowClick(report), children: [
                                      _jsx(TableCell, {
                                        className: "pl-8 py-5", children:
                                          _jsxs("div", {
                                            className: "flex flex-col gap-2", children: [
                                              _jsxs("div", {
                                                className: "flex items-center gap-3", children: [
                                                  _jsxs("span", { className: "text-[10px] font-mono font-semibold text-muted-foreground/60 tracking-tighter bg-muted/30 px-2 py-0.5 rounded border border-border", children: ["#", report.id.slice(0, 6)] }),
                                                  _jsx("span", { className: "text-foreground font-semibold text-sm tracking-tight group-hover:text-[#FF0C60] transition-colors", children: report.problemDescription.length > 50 ? `${report.problemDescription.slice(0, 50)}...` : report.problemDescription })]
                                              }
                                              ),
                                              _jsxs("div", {
                                                className: "flex items-center gap-2", children: [
                                                  _jsx("div", { className: "w-5 h-5 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground font-bold border border-border", children: report.operatorName.split(' ').map((n) => n[0]).join('').substring(0, 2) }),
                                                  _jsx("span", { className: "text-[10px] font-medium text-muted-foreground tracking-tight", children: report.operatorName })]
                                              }
                                              )]
                                          }
                                          )
                                      }
                                      ),
                                      _jsx(TableCell, { className: "py-5", children: _jsx("span", { className: "text-xs text-foreground font-medium tracking-tight", children: report.category }) }),
                                      _jsx(TableCell, {
                                        className: "py-5", children:
                                          _jsxs("div", {
                                            className: "flex flex-col gap-2 items-start", children: [
                                              _jsx("div", { className: "scale-90 origin-left", children: getStatusBadge(report.status) }),
                                              report.emailStatus &&
                                              _jsxs(Badge, {
                                                variant: "outline", className: `scale-90 origin-left border-dashed
                                                            ${report.emailStatus === 'sent' ? 'text-blue-500 border-blue-500/30' : ''}
                                                            ${report.emailStatus === 'pending' ? 'text-amber-500 border-amber-500/30' : ''}
                                                            ${report.emailStatus === 'error' ? 'text-red-500 border-red-500/30' : ''}
                                                            ${!report.emailStatus || report.emailStatus === 'none' ? 'text-muted-foreground border-border bg-muted/30' : ''}
                                                        `, children: [
                                                  _jsx(Mail, { className: "w-3 h-3 mr-1" }),
                                                  report.emailStatus === 'sent' ? 'Enviado' :
                                                    report.emailStatus === 'pending' ? 'Pendiente' :
                                                      report.emailStatus === 'error' ? 'Error' : 'No Enviado']
                                              }
                                              )]
                                          }

                                          )
                                      }
                                      ),
                                      _jsx(TableCell, {
                                        className: "py-5", children:
                                          _jsxs("div", {
                                            className: "flex items-center gap-2", children: [
                                              (report.comments?.length || 0) > 0 && _jsx("div", { className: "w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center", title: "Comentarios", children: _jsx(MessageSquare, { className: "w-3.5 h-3.5 text-blue-500" }) }),
                                              (report.reactions?.length || 0) > 0 && _jsx("div", { className: "w-8 h-8 rounded-md bg-[#FF0C60]/10 border border-[#FF0C60]/20 flex items-center justify-center", title: "Reacciones", children: _jsx(ThumbsUp, { className: "w-3.5 h-3.5 text-[#FF0C60]" }) }),
                                              !report.comments?.length && !report.reactions?.length && _jsx("span", { className: "text-muted-foreground/30 font-medium", children: "-" })]
                                          }
                                          )
                                      }
                                      ),
                                      _jsx(TableCell, { className: "py-5", children: _jsx(Badge, { variant: "outline", className: `bg-muted/30 text-[9px] font-semibold tracking-tight border-border rounded px-3 py-1 ${report.priority === 'Enlace' ? 'text-indigo-400 border-indigo-500/30' : report.priority === 'EJTV' ? 'text-[#FF0C60] border-[#FF0C60]/30' : ''}`, children: report.priority }) }),
                                      _jsx(TableCell, {
                                        className: "pr-10 py-5 text-right", onClick: (e) => e.stopPropagation(), children:
                                          _jsx("div", {
                                            className: "flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity", children:
                                              _jsxs(TooltipProvider, {
                                                children: [
                                                  report.status !== 'resolved' &&
                                                  _jsxs(Tooltip, {
                                                    children: [
                                                      _jsx(TooltipTrigger, {
                                                        asChild: true, children:
                                                          _jsx(Button, { size: "icon", variant: "ghost", onClick: (e) => handleResolve(report.id, e), className: "w-9 h-9 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-md transition-all shadow-lg hover:shadow-emerald-500/20", children: _jsx(CheckCircle, { className: "w-4 h-4" }) })
                                                      }
                                                      ),
                                                      _jsx(TooltipContent, { className: "bg-emerald-500 border-none font-bold text-white", children: _jsx("p", { children: "RESOLVER" }) })]
                                                  }
                                                  ),

                                                  _jsx("div", { className: "w-px h-5 bg-border mx-1" }),
                                                  _jsxs(Tooltip, {
                                                    children: [
                                                      _jsx(TooltipTrigger, {
                                                        asChild: true, children:
                                                          _jsx(Button, { size: "icon", variant: "ghost", onClick: (e) => { e.stopPropagation(); handleAction(report, 'download'); }, className: "w-9 h-9 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition-colors", children: _jsx(FileText, { className: "w-4 h-4" }) })
                                                      }
                                                      ),
                                                      _jsx(TooltipContent, { className: "bg-cyan-500 border-none font-bold text-white", children: _jsx("p", { children: "DESCARGAR PDF" }) })]
                                                  }
                                                  ),
                                                  _jsxs(Tooltip, {
                                                    children: [
                                                      _jsx(TooltipTrigger, {
                                                        asChild: true, children:
                                                          _jsx(Button, { size: "icon", variant: "ghost", onClick: (e) => { e.stopPropagation(); handleAction(report, 'email'); }, className: "w-9 h-9 text-muted-foreground hover:text-violet-400 hover:bg-violet-400/10 rounded-md transition-colors", children: _jsx(Mail, { className: "w-4 h-4" }) })
                                                      }
                                                      ),
                                                      _jsx(TooltipContent, { className: "bg-violet-500 border-none font-bold text-white", children: _jsx("p", { children: "ENVIAR CORREO" }) })]
                                                  }
                                                  ),
                                                  _jsxs(Tooltip, {
                                                    children: [
                                                      _jsx(TooltipTrigger, {
                                                        asChild: true, children:
                                                          _jsx(Button, { size: "icon", variant: "ghost", onClick: (e) => { e.stopPropagation(); handleAction(report, 'both'); }, className: "w-9 h-9 text-muted-foreground hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 rounded-md transition-colors", children: _jsx(Send, { className: "w-4 h-4" }) })
                                                      }
                                                      ),
                                                      _jsx(TooltipContent, { className: "bg-[#FF0C60] border-none font-bold text-white", children: _jsx("p", { children: "ENVIAR + DESCARGAR" }) })]
                                                  }
                                                  )]
                                              }
                                              )
                                          }
                                          )
                                      }
                                      )]
                                  }, report.id
                                  )
                                )
                            }
                            )]
                        }
                        )
                    }
                    ),
                    filteredReports.length === 0 &&
                    _jsxs("div", {
                      className: "py-32 text-center", children: [
                        _jsx("div", { className: "w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-border border-dashed ring-8 ring-muted/5", children: _jsx(Zap, { className: "w-12 h-12 text-muted-foreground/30" }) }),
                        _jsx("h3", { className: "text-xl font-bold text-foreground/50 tracking-tight", children: "Sin resultados" }),
                        _jsx("p", { className: "text-muted-foreground font-semibold text-xs mt-2 tracking-normal", children: "No se encontraron reportes que coincidan con los filtros" })]
                    }
                    )]
                }

                )
            }
            ),

            _jsxs(motion.div, {
              initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, className: "mt-16 mb-20 bg-card/10 p-6 md:p-10 rounded-md border border-border border-dashed", children: [
                _jsxs("div", {
                  className: "flex items-center gap-4 mb-8", children: [
                    _jsx("div", { className: "w-1.5 h-8 bg-[#FF0C60] rounded-full" }),
                    _jsx("h2", { className: "text-2xl font-bold text-foreground tracking-tight", children: "Historial de Notificaciones" })]
                }
                ),
                _jsx(EmailHistoryCard, {})]
            }
            )]
        }
        )]
    }
    ));

}

function EmailHistoryCard() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resend/history').
      then((res) => res.json()).
      then((data) => {
        if (data && Array.isArray(data.data)) setEmails(data.data.slice(0, 5));
      }).
      catch((err) => console.error(err)).
      finally(() => setLoading(false));
  }, []);

  if (loading) return _jsx("div", { className: "text-slate-500 text-sm", children: "Cargando historial..." });

  if (emails.length === 0) return (
    _jsx(Card, {
      className: "bg-card/50 backdrop-blur-xl border border-border p-8 text-center rounded-md", children:
        _jsx("p", { className: "text-muted-foreground", children: "No hay registros de correos enviados recientemente." })
    }
    ));


  return (
    _jsx(Card, {
      className: "bg-card/50 backdrop-blur-xl border border-border overflow-hidden rounded-md ring-1 ring-border", children:
        _jsx("div", {
          className: "overflow-x-auto", children:
            _jsxs(Table, {
              children: [
                _jsx(TableHeader, {
                  className: "bg-muted/10", children:
                    _jsxs(TableRow, {
                      className: "border-border hover:bg-transparent", children: [
                        _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight pl-6", children: "Asunto" }),
                        _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight", children: "Destinatario" }),
                        _jsx(TableHead, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight", children: "Fecha" }),
                        _jsx(TableHead, { className: "text-right text-muted-foreground font-semibold text-[10px] tracking-tight pr-6", children: "Estado" })]
                    }
                    )
                }
                ),
                _jsx(TableBody, {
                  children:
                    emails.map((email) =>
                      _jsxs(TableRow, {
                        className: "border-border hover:bg-muted/20 transition-colors", children: [
                          _jsx(TableCell, { className: "pl-6 py-4 text-foreground font-medium", children: email.subject }),
                          _jsx(TableCell, { className: "py-4 text-muted-foreground text-sm", children: Array.isArray(email.to) ? email.to.join(', ') : email.to }),
                          _jsx(TableCell, { className: "py-4 text-muted-foreground text-xs", children: new Date(email.created_at).toLocaleString() }),
                          _jsx(TableCell, {
                            className: "py-4 pr-6 text-right", children:
                              _jsx(Badge, {
                                variant: "outline", className: `
                    ${email.last_event === 'delivered' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : ''}
                    ${email.last_event === 'sent' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : ''}
                    ${!['delivered', 'sent'].includes(email.last_event) ? 'text-muted-foreground border-border' : ''}
                  `, children:
                                  email.last_event === 'delivered' ? 'Entregado' : email.last_event === 'sent' ? 'Enviado' : email.last_event
                              }
                              )
                          }
                          )]
                      }, email.id
                      )
                    )
                }
                )]
            }
            )
        }
        )
    }
    ));

}