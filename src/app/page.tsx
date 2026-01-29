"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle, Clock, Plus, Activity, ArrowUpRight, MessageSquare, User as UserIcon } from "lucide-react"
import { Report, DashboardStats } from "@/types"

import Link from "next/link"
import { ProcessingModal } from "@/components/ProcessingModal"
import { SuccessModal } from "@/components/SuccessModal"
import { motion } from "framer-motion"
import { DescriptionCell } from "@/components/DescriptionCell"
import { BitcentralWidget } from "@/components/BitcentralWidget"

// Helper para animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    criticalReports: 0,
    reportsToday: 0,
    averageResolutionTime: 0
  })

  const [recentReports, setRecentReports] = useState<Report[]>([])

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
    isOpen: false, type: 'success', message: ''
  })
  const [processing] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false, title: "", message: ""
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([])
  const [chartData, setChartData] = useState<{ labels: string[], values: number[] }>({ labels: [], values: [] })

  // User State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Read User
    const savedUser = localStorage.getItem("enlace-user")
    if (savedUser) setCurrentUser(JSON.parse(savedUser))

    // Parallel Fetching
    Promise.all([
      fetch('/api/reports').then(res => res.json()),
      fetch('/api/users').then(res => res.json())
    ]).then(([allReports, usersData]) => {
      // Filter out Automated Reports for the Dashboard
      const reports = allReports.filter((r: Report) => r.operatorName !== 'Monitoreo Automático')

      // Process Reports
      const totalReports = reports.length
      const pendingReports = reports.filter((r: Report) => r.status === 'pending').length
      const resolvedReports = reports.filter((r: Report) => r.status === 'resolved').length
      // Fix: Critical only counts unresolved High Priority items
      // Assuming 'Enlace' or 'Todos' implies High Priority/Critical Channel
      const criticalReports = reports.filter((r: Report) =>
        (r.priority === 'Enlace' || r.priority === 'Todos') && r.status !== 'resolved'
      ).length

      const today = new Date().toDateString()
      const reportsToday = reports.filter((r: Report) => new Date(r.createdAt).toDateString() === today).length

      setStats({ totalReports, pendingReports, resolvedReports, criticalReports, reportsToday, averageResolutionTime: 0 })
      setRecentReports(reports.slice(-5).reverse())

      // Calculate Chart Data (Last 7 Days)
      const days = []
      const values = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        // Store label (e.g., "Lun")
        days.push(d.toLocaleDateString('es-CR', { weekday: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('es-CR', { weekday: 'short' }).slice(1))

        // Count reports for this day
        const dayStr = d.toDateString()
        const count = reports.filter((r: Report) => new Date(r.createdAt).toDateString() === dayStr).length
        values.push(count)
      }
      setChartData({ labels: days, values })

      // Process Users
      if (Array.isArray(usersData)) setUsers(usersData)
    }).catch(err => console.error("Error fetching dashboard data:", err))
  }, []) // Remove currentUser dependency to avoid loop, it's local only

  // ... (rest of simple handlers)



  // Wait, I need to store all reports to generate the chart.
  // I will modify the component slightly to store 'allReports' or just the chart data.
  // Let's modify the useEffect to calculate chart data and store it.

  // ... refactoring ...



  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' })
      })
      if (res.ok) {
        setModal({ isOpen: true, type: 'success', message: '¡Incidencia resuelta!' })
        setTimeout(() => window.location.reload(), 1500)
      } else throw new Error()
    } catch (error) {
      setModal({ isOpen: true, type: 'error', message: 'Error de conexión.' })
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
    }
    const labels = { 'resolved': 'Resuelto', 'in-progress': 'En Progreso', 'pending': 'Pendiente' }
    // @ts-expect-error - styles object key access
    return <Badge variant="outline" className={`${styles[status] || 'bg-slate-700'} border transition-all duration-300 hover:scale-105`}>{labels[status] || status}</Badge>
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-slate-100 selection:bg-[#FF0C60] selection:text-white pb-20">

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
      </div>

      <motion.div
        initial="hidden" animate="visible" variants={containerVariants}
        className="relative z-10 max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8 pt-16 md:pt-32"
      >
        <ProcessingModal isOpen={processing.isOpen} title={processing.title} message={processing.message} />
        <SuccessModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} type={modal.type} message={modal.message} />

        {/* HERO SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 pb-2 md:pb-4">
          <div>
            <h1 className="text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter loading-none">
              {currentUser?.role === 'ENGINEER' ? (
                <>Ingeniería <span className="text-purple-500">Master</span></>
              ) : (
                <>Control <span className="text-[#FF0C60]">Master</span></>
              )}
            </h1>
            <p className="text-slate-400 mt-1 md:mt-2 text-sm md:text-lg font-light tracking-wide">
              Panel de operaciones y monitoreo en tiempo real.
            </p>
          </div>
          <Link href="/crear-reporte">
            <Button size="lg" className="bg-[#FF0C60] hover:bg-[#D90A50] text-white shadow-[0_0_20px_rgba(255,12,96,0.3)] rounded-full px-8 h-12 text-base transition-all hover:scale-105 active:scale-95 font-medium">
              <Plus className="w-5 h-5 mr-2" /> Nueva Incidencia
            </Button>
          </Link>
        </motion.div>

        {/* STATS GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">

          <StatsCard
            title="Total Reportes"
            value={stats.totalReports}
            subtitle={`+${stats.reportsToday} hoy`}
            icon={<Activity className="w-5 h-5 text-[#FF0C60]" />}

          />
          <StatsCard
            title="Pendientes"
            value={stats.pendingReports}
            subtitle="Atención requerida"
            valueColor="text-[#FF0C60]"
            icon={<Clock className="w-5 h-5 text-[#FF0C60]" />}

            borderColor="group-hover:border-[#FF0C60]/30"
          />
          <StatsCard
            title="Resueltos"
            value={stats.resolvedReports}
            subtitle="Cerrados con éxito"
            valueColor="text-emerald-400"
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}

            borderColor="group-hover:border-emerald-500/30"
          />
          <StatsCard
            title="Críticos"
            value={stats.criticalReports}
            subtitle="Prioridad Alta"
            valueColor="text-orange-400"
            icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}

            borderColor="group-hover:border-orange-500/30"
          />
        </motion.div>

        {/* ENGINEER CHART */}
        {currentUser?.role === 'ENGINEER' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-3xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" /> Tendencia Semanal
                </CardTitle>
                <CardDescription className="text-slate-400">Reportes generados en los últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full p-4 flex flex-col justify-between relative group">
                  {/* Chart Content */}
                  {chartData.values.length > 0 ? (
                    <>
                      {/* 1. SVG Layer (Line & Area) - Stretches to fill */}
                      <div className="absolute inset-x-4 top-4 bottom-10">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const max = Math.max(...chartData.values, 5);
                            const xStep = 100 / (chartData.values.length - 1);

                            const points = chartData.values.map((val, i) => {
                              const x = i * xStep;
                              const y = 90 - ((val / max) * 80);
                              return `${x},${y}`;
                            }).join(' ');

                            const fillPath = `M 0,100 ${points} L 100,100 Z`;
                            const linePath = `M ${points.split(' ')[0]} L ${points.split(' ').slice(1).join(' L ')}`;

                            return (
                              <>
                                <path d={fillPath} fill="url(#lineGradient)" />
                                <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            )
                          })()}
                        </svg>

                        {/* 2. HTML Overlay Layer (Points & Tooltips) - Does NOT stretch */}
                        {chartData.values.map((val, i) => {
                          const max = Math.max(...chartData.values, 5);
                          const xPercent = (i / (chartData.values.length - 1)) * 100;
                          const yPercent = 90 - ((val / max) * 80); // Match SVG Y calculation (0-100 coord space = %)

                          return (
                            <div
                              key={i}
                              className="absolute w-4 h-4 -ml-2 -mt-2 group/point flex items-center justify-center cursor-pointer"
                              style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                            >
                              {/* Hit Area Bubble */}
                              <div className="absolute inset-0 rounded-full bg-transparent hover:bg-cyan-500/10 transition-colors" />

                              {/* Visible Dot */}
                              <div className="w-2 h-2 rounded-full bg-[#0f172a] border-2 border-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.5)] group-hover/point:scale-150 transition-transform" />

                              {/* Tooltip Value */}
                              <div className="absolute bottom-full mb-2 bg-[#1e293b] text-[#22d3ee] text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {val}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* X Axis (Static at bottom) */}
                      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] uppercase font-bold text-slate-500">
                        {chartData.labels.map((l, i) => (
                          <div key={i} className="w-8 text-center">{l}</div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      No hay datos suficientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: REPORTS & COMMENTS */}
          <div className="lg:col-span-2 space-y-8">

            {/* RECENT REPORTS */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-3xl group ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-6 relative">
                  <div>
                    <CardTitle className="text-xl text-white">Últimos Reportes</CardTitle>
                    <CardDescription className="text-slate-400 mt-1">Incidencias recientes registradas</CardDescription>
                  </div>
                  <Link href="/reportes">
                    <Button variant="ghost" className="text-[#FF0C60] hover:text-white hover:bg-[#FF0C60]/10 group-hover:translate-x-1 transition-all rounded-full px-4 text-sm h-8 font-medium">
                      Ver Todos <ArrowUpRight className="ml-2 w-3 h-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto relative z-10">
                  {recentReports.length > 0 ? (
                    <div className="min-w-[600px]">
                      <Table>
                        <TableHeader className="bg-white/[0.02]">
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-400 pl-6 h-10 font-medium text-xs uppercase tracking-wider">ID</TableHead>
                            <TableHead className="text-slate-400 h-10 font-medium text-xs uppercase tracking-wider">Detalles</TableHead>
                            <TableHead className="text-slate-400 h-10 font-medium text-xs uppercase tracking-wider">Estado</TableHead>
                            <TableHead className="text-slate-400 pr-6 h-10 text-right font-medium text-xs uppercase tracking-wider">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentReports.map((report) => (
                            <TableRow key={report.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                              <TableCell className="font-mono text-xs text-slate-500 pl-6 py-4">#{report.id.slice(0, 6)}</TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-col gap-1.5">
                                  <DescriptionCell text={report.problemDescription} maxLength={40} className="text-slate-200" />
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {report.operatorName.split(' ')[0]}</span>

                                    {/* Channel Badge */}
                                    <Badge variant="outline" className={`
                                      text-[10px] px-2 py-0.5 border
                                      ${report.priority === 'Enlace' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        report.priority === 'EJTV' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                          'bg-slate-700/10 text-slate-400 border-slate-700/20'}
                                    `}>
                                      {report.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 transform scale-90 origin-left">{getStatusBadge(report.status)}</TableCell>
                              <TableCell className="pr-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                  {report.status !== 'resolved' && (
                                    <Button size="icon" variant="ghost" onClick={(e) => handleResolve(report.id, e)} className="h-8 w-8 text-emerald-400 hover:text-white hover:bg-emerald-500 rounded-full transition-all" title="Resolver">
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No hay reportes recientes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* RECENT ACTIVITY (COMMENTS) */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-xl rounded-3xl overflow-hidden ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <CardHeader className="border-b border-white/5 pb-4 p-6">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" /> Comentarios Recientes
                  </CardTitle>
                  <CardDescription className="text-slate-400">Última actividad en el sistema</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <RecentActivityFeed reports={recentReports} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: SCHEDULE */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            {/* Styled Bitcentral Widget Wrapper */}
            <div className="h-full">
              <BitcentralWidget users={users} />
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;

  borderColor?: string;
}

function StatsCard({ title, value, subtitle, icon, valueColor = "text-white", borderColor = "group-hover:border-white/20" }: StatsCardProps) {
  return (
    <Card className={`bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border-white/5 shadow-lg transition-all duration-300 group relative overflow-hidden rounded-2xl md:rounded-3xl border hover:-translate-y-1 ${borderColor} ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />

      <CardContent className="p-4 md:p-6 relative z-10">
        <div className="flex justify-between items-start mb-3 md:mb-6">
          <div className="p-2 md:p-3 bg-white/5 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-white/5">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <h3 className={`text-2xl md:text-4xl font-black tracking-tight ${valueColor}`}>{value}</h3>
          <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 md:mt-2 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block group-hover:bg-[#FF0C60] transition-colors shrink-0" />
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityFeed({ reports }: { reports: Report[] }) {
  // Flatten comments
  const allComments = reports.flatMap(r =>
    (r.comments || []).map(c => ({
      ...c,
      reportId: r.id,
      reportDesc: r.problemDescription
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  if (allComments.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">Sin comentarios aún.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {allComments.map((c, i) => (
        <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 border border-white/5">
              {c.author?.name?.substring(0, 2).toUpperCase() || "??"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">
                <span className="font-semibold text-white">{c.author?.name}</span> <span className="text-slate-500">en</span> <span className="text-[#FF0C60] font-mono text-xs">#{c.reportId.slice(0, 6)}</span>
              </p>
              <div className="text-xs text-slate-400 truncate mt-0.5 opacity-60">
                Ref: {c.reportDesc}
              </div>
              <p className="text-sm text-slate-300 mt-2 bg-[#050505]/40 p-3 rounded-xl border border-white/5 break-words">
                {c.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
