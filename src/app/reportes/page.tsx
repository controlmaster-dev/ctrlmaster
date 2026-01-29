"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, FileText, Send, CheckCircle, Mail, Zap, MessageSquare, ThumbsUp, Clock, CheckCircle2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Report } from "@/types"
import { generateReportPDF } from "@/utils/pdfGenerator"
import { ProcessingModal } from "@/components/ProcessingModal"
import { EmailSendModal } from "@/components/EmailSendModal"
import { SuccessModal } from "@/components/SuccessModal"

import Link from "next/link"
import { motion } from "framer-motion"

import { ReportDetailModal } from "@/components/ReportDetailModal"

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  // Modals state
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ isOpen: false, type: 'success', message: '' })
  const [processing, setProcessing] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: "", message: "" })
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    report: Report | null;
    type: 'email' | 'both';
  }>({
    isOpen: false,
    report: null,
    type: 'email'
  });

  // User State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const fetchReports = async () => {
    // setLoading(true) // Don't show full loading on silent refresh
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (Array.isArray(data)) {
        // Filter out "Monitoreo Automático" globally by operator name
        const validReports = data.filter((r: Report) => r.operatorName !== 'Monitoreo Automático')
        setReports(validReports)
        setFilteredReports(validReports)
      } else {
        console.error("API returned non-array:", data)
        setReports([])
        setFilteredReports([])
      }

      // Update selected report if open
      if (selectedReport) {
        const updated = data.find((r: Report) => r.id === selectedReport.id)
        if (updated) setSelectedReport(updated)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    // Fetch user
    const savedUser = localStorage.getItem("enlace-user")
    if (savedUser) setCurrentUser(JSON.parse(savedUser))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let filtered = reports
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.problemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== "all") filtered = filtered.filter(report => report.status === statusFilter)

    if (priorityFilter !== "all") filtered = filtered.filter(report => report.priority === priorityFilter)


    if (categoryFilter !== "all") filtered = filtered.filter(report => report.category === categoryFilter)
    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, priorityFilter, categoryFilter])

  const handleRowClick = (report: Report) => {
    setSelectedReport(report)
    setDetailModalOpen(true)
  }

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' })
      })
      if (res.ok) {
        setModal({ isOpen: true, type: 'success', message: 'Reporte marcado como resuelto.' })
        fetchReports()
      } else throw new Error("Error al actualizar")
    } catch (error) {
      setModal({ isOpen: true, type: 'error', message: 'Error de servidor.' })
    }
  }

  const executeAction = async (report: Report, type: 'download' | 'email' | 'both', recipients?: string[]) => {
    let title = ""; let message = ""
    if (type === 'download') { title = "Generando PDF"; message = "Preparando descarga..." }
    if (type === 'email') { title = "Enviando Correo"; message = "Contactando servidor de correo..." }
    if (type === 'both') { title = "Procesando"; message = "Generando PDF y enviando notificación..." }

    setProcessing({ isOpen: true, title, message })

    try {
      const download = type === 'download' || type === 'both'
      const email = type === 'email' || type === 'both'

      // Simulate delay for effect
      await new Promise(r => setTimeout(r, 1200))

      const res = await generateReportPDF(report, { download, email, recipients })

      setProcessing(prev => ({ ...prev, isOpen: false }))

      if (res?.success) setModal({ isOpen: true, type: 'success', message: '¡Listo!' })
      else if (email && !res?.success) setModal({ isOpen: true, type: 'error', message: res?.message || 'Error al enviar correo' })
      else setModal({ isOpen: true, type: 'success', message: 'Operación completada.' })
    } catch (error) {
      setProcessing(prev => ({ ...prev, isOpen: false }))
      setModal({ isOpen: true, type: 'error', message: 'Hubo un error al procesar.' })
    }
  }

  const handleAction = async (report: Report, type: 'download' | 'email' | 'both') => {
    // If just downloading, proceed immediately
    if (type === 'download') {
      executeAction(report, type)
      return
    }

    // For email actions, open the config modal
    setEmailModal({ isOpen: true, report, type })
  }

  const handleEmailConfirm = (recipients: string[]) => {
    if (emailModal.report) {
      executeAction(emailModal.report, emailModal.type, recipients)
    }
  }

  // Badges & Labels
  const getCategoryLabel = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Resuelto</Badge>
      case "pending": return <Badge className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
      default: return <Badge variant="outline" className="text-slate-400 border-slate-700">Desconocido</Badge>
    }
  }

  const getPriorityBadge = (prio: string) => {
    const styles: Record<string, string> = {
      'Enlace': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'EJTV': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Enlace USA': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', // Fixed map key
      'EnlaceUSA': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    }
    return <Badge className={`border ${styles[prio] || 'border-slate-700 text-slate-400'}`}>{prio}</Badge>
  }

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FF0C60] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 pb-20 font-sans selection:bg-[#FF0C60] selection:text-white">

      {/* Detail Modal */}
      <ReportDetailModal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedReport(null) }}
        report={selectedReport}
        currentUser={currentUser}
        onUpdate={() => {
          fetchReports()
          // Optional: Re-select updated report if still matching
        }}
      />

      <ProcessingModal isOpen={processing.isOpen} title={processing.title} message={processing.message} />
      <SuccessModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.type === 'success' ? 'Éxito' : 'Error'}
        message={modal.message}
        type={modal.type}
      />
      <EmailSendModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleEmailConfirm}
        reportId={emailModal.report?.id || ""}
        title={emailModal.type === 'both' ? "Enviar y Descargar" : "Enviar Reporte"}
      />

      {/* Hero Section */}
      <div className="relative pt-32 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#121214] to-transparent pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500">
              Panel de Incidencias
            </h1>
            <p className="text-slate-500 text-lg">Gestión y monitoreo de reportes técnicos.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/crear-reporte">
              <Button size="lg" className="rounded-full bg-[#FF0C60] hover:bg-[#D90A50] text-white font-bold px-8 shadow-lg shadow-[#FF0C60]/20 transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5 mr-2" /> Nuevo Reporte
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Reportes', value: reports.length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Pendientes', value: reports.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Resueltos', value: reports.filter(r => r.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
          ].map((kpi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 relative overflow-hidden group shadow-lg ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              <div className={`absolute top-0 right-0 p-32 ${kpi.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="relative z-10 flex flex-col">
                <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-4`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <span className="text-4xl font-black text-white tracking-tight mb-1">{kpi.value}</span>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">{kpi.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Control Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="sticky top-4 z-40 mb-8">
          <div className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2 items-center ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar por ID, operador o descripción..."
                className="pl-10 h-12 bg-transparent border-none text-white placeholder:text-slate-600 focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            {/* Toggles */}
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
              {['all', 'Enlace', 'EJTV', 'EnlaceUSA'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${priorityFilter === filter ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                  {filter === 'all' ? 'Todos' : filter}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            {/* Status Select */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-10 border-none bg-transparent text-slate-400 focus:ring-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181B] border-white/10 text-slate-300">
                <SelectItem value="all">Cualquier Estado</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Main Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-3xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-6">Incidencia</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Categoría</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Estado</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Actividad</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Canal</TableHead>
                    <TableHead className="text-right text-slate-500 font-bold uppercase text-[10px] tracking-widest pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="border-white/5 group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => handleRowClick(report)}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">#{report.id.slice(0, 6)}</span>
                            <span className="text-white font-medium line-clamp-1 group-hover:text-[#FF0C60] transition-colors">{report.problemDescription.slice(0, 40)}...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 uppercase font-bold">
                              {report.operatorName.slice(0, 2)}
                            </div>
                            <span className="text-xs text-slate-500">{report.operatorName}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-slate-300 font-medium">{getCategoryLabel(report.category)}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {(report.comments?.length || 0) > 0 && (
                            <div className="w-7 h-7 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center z-10" title="Comentarios">
                              <MessageSquare className="w-3 h-3 text-blue-400" />
                            </div>
                          )}
                          {(report.reactions?.length || 0) > 0 && (
                            <div className="w-7 h-7 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center z-20" title="Reacciones">
                              <ThumbsUp className="w-3 h-3 text-pink-400" />
                            </div>
                          )}
                          {(!report.comments?.length && !report.reactions?.length) && <span className="text-slate-600 text-xs">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getPriorityBadge(report.priority)}
                      </TableCell>
                      <TableCell className="pr-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1">
                          <TooltipProvider>
                            {report.status !== 'resolved' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleResolve(report.id, e)}
                                    className="w-8 h-8 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-full transition-colors"

                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Marcar como Resuelto</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            <div className="w-px h-4 bg-white/10 mx-1" />

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleAction(report, 'download') }}
                                  className="w-8 h-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Solo descargar PDF</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleAction(report, 'email') }}
                                  className="w-8 h-8 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Solo enviar por correo</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); handleAction(report, 'both') }}
                                  className="w-8 h-8 text-slate-400 hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 rounded-full transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Descargar PDF y enviar correo</p>
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
            {filteredReports.length === 0 && (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-lg font-medium text-slate-400">Todo limpio</h3>
                <p className="text-slate-600">No hay reportes que coincidan con tu búsqueda.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
