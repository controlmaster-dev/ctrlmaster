"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Plus, Activity, ArrowUpRight, FileText, Users as UsersIcon, MonitorPlay } from "lucide-react";

import Link from "next/link";
import { ProcessingModal } from "@/components/ProcessingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { LiveActivityCard } from "@/components/dashboard/LiveActivityCard";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { BirthdayWidget } from "@/components/BirthdayWidget";

const BitcentralWidget = dynamic(() => import("@/components/BitcentralWidget").then((mod) => mod.BitcentralWidget), {
  loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
  ssr: false
});

export function DashboardClient() {
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    criticalReports: 0,
    reportsToday: 0,
    averageResolutionTime: 0
  });

  const [recentReports, setRecentReports] = useState<any[]>([]);

  const [modal, setModal] = useState({
    isOpen: false, type: 'success', message: ''
  });
  const [processing] = useState({
    isOpen: false, title: "", message: ""
  });

  const [users, setUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [comments, setComments] = useState<any[]>([]);

  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!loadingReports && !loadingUsers) {
      const timer = setTimeout(() => setIsPageLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsPageLoading(true);
    }
  }, [loadingReports, loadingUsers]);

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    setLoadingReports(true);
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        const reports = Array.isArray(data) ? data.filter((r) => r.operatorName !== 'Monitoreo Automático') : [];
        const totalReports = reports.length;
        const pendingReports = reports.filter((r) => r.status === 'pending').length;
        const resolvedReports = reports.filter((r) => r.status === 'resolved').length;
        const criticalReports = reports.filter((r) =>
          (r.priority === 'Enlace' || r.priority === 'Todos') && r.status !== 'resolved'
        ).length;
        const today = new Date().toDateString();
        const reportsToday = reports.filter((r) => new Date(r.createdAt).toDateString() === today).length;

        setStats({ totalReports, pendingReports, resolvedReports, criticalReports, reportsToday, averageResolutionTime: 0 });

        const sortedReports = [...reports].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentReports(sortedReports.slice(0, 5));

        const days: string[] = [];
        const values: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toLocaleDateString('es-CR', { weekday: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('es-CR', { weekday: 'short' }).slice(1));
          const dayStr = d.toDateString();
          const count = reports.filter((r) => new Date(r.createdAt).toDateString() === dayStr).length;
          values.push(count);
        }
        setChartData({ labels: days, values });
      })
      .catch((err) => console.error("Error fetching reports:", err))
      .finally(() => setLoadingReports(false));

    setLoadingUsers(true);
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error("Error fetching users:", err))
      .finally(() => setLoadingUsers(false));

    setLoadingComments(true);
    fetch('/api/comments/recent')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch((err) => console.error("Error fetching comments:", err))
      .finally(() => setLoadingComments(false));
  }, []);

  useEffect(() => {
    if (!loadingUsers && users.length > 0) {
      const today = new Date();
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const currentDay = today.getDate().toString().padStart(2, '0');

      const birthdayUsers = users.filter((u) => {
        if (!u.birthday) return false;
        const [m, d] = u.birthday.split('-');
        return m === currentMonth && d === currentDay;
      });

      if (birthdayUsers.length > 0) {
        const todayStr = today.toDateString();
        const lastShown = sessionStorage.getItem('birthday-toast-shown-date');

        if (lastShown !== todayStr) {
          birthdayUsers.forEach((u) => {
            toast(`¡Feliz Cumpleaños ${u.name.split(' ')[0]}! 🎂`, {
              description: "Hoy es un día especial para nuestro equipo.",
              duration: 10000,
              action: {
                label: "Celebrar 🎉",
                onClick: () => console.log("Celebrated!")
              }
            });
          });
          sessionStorage.setItem('birthday-toast-shown-date', todayStr);
        }
      }
    }
  }, [users, loadingUsers]);

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' })
      });
      if (res.ok) {
        setModal({ isOpen: true, type: 'success', message: '¡Incidencia resuelta!' });
        setTimeout(() => window.location.reload(), 1500);
      } else throw new Error();
    } catch (error) {
      setModal({ isOpen: true, type: 'error', message: 'Error de conexión.' });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
    };
    const labels: Record<string, string> = { 'resolved': 'Resuelto', 'in-progress': 'En Progreso', 'pending': 'Pendiente' };
    return (
      <Badge variant="outline" className={`${styles[status] || 'bg-slate-700'} border transition-all duration-300 hover:scale-105`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const firstName = currentUser?.name?.trim()?.split(/\s+/)[0];
  const isEngineer = currentUser?.role === "ENGINEER";

  return (
    <div className="min-h-screen relative overflow-hidden text-foreground selection:bg-[#FF0C60] selection:text-white pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-8%] right-[-5%] w-[35%] h-[35%] bg-[#FF0C60]/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-[0%] left-[-8%] w-[32%] h-[32%] bg-violet-600/8 blur-[90px] rounded-full" />
      </div>

      <ProcessingModal isOpen={processing.isOpen} title={processing.title} message={processing.message} />
      <SuccessModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} type={modal.type as any} title={modal.type === 'success' ? 'Operación Exitosa' : 'Error'} message={modal.message} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-[1600px] mx-auto space-y-4 md:space-y-8 p-4 md:p-8 pt-20 md:pt-6"
      >
        <AnimatePresence mode="wait">
          {isPageLoading ? (
            <DashboardSkeleton key="skeleton" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-10"
            >
              <div className="relative z-10 flex flex-col items-start gap-6 md:gap-8 py-6 md:py-10 border border-border/50 bg-card/40 backdrop-blur-xl rounded-2xl p-6 md:p-10 overflow-hidden shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF0C60]/5 via-transparent to-violet-600/5 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-6 md:gap-8">
                  <div className="space-y-3 md:space-y-4 max-w-3xl w-full">
                    {firstName && (
                      <p className="text-sm font-medium text-muted-foreground/90 tracking-wide">
                        Hola, <span className="text-foreground/90">{firstName}</span>
                      </p>
                    )}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.08]">
                      {isEngineer ? (
                        <>Ingeniería <span className="text-purple-400 font-semibold tracking-tight">Master</span></>
                      ) : (
                        <>Control <span className="text-[#FF0C60] font-semibold tracking-tight">Master</span></>
                      )}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base font-medium max-w-lg leading-relaxed border-l-2 border-[#FF0C60]/25 pl-4">
                      Panel de operadores y monitoreo en tiempo real.
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end gap-4 w-full md:w-auto">
                    <div className="grid grid-cols-2 md:flex gap-3 md:gap-4">
                      <Link href="/operadores/monitoreo" className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Button variant="outline" className="w-full h-12 md:px-6 border-border/60 bg-card/60 text-muted-foreground hover:text-cyan-400 rounded-xl gap-2 md:gap-3 backdrop-blur-md transition-all group-hover:border-cyan-500/35 group-hover:scale-[1.02] active:scale-[0.98]">
                          <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="font-semibold text-sm md:text-base tracking-tight">Monitorear</span>
                        </Button>
                      </Link>

                      <Link href="/operadores" className="relative group">
                        <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Button variant="outline" className="w-full h-12 md:px-6 border-border/60 bg-card/60 text-muted-foreground hover:text-violet-400 rounded-xl gap-2 md:gap-3 backdrop-blur-md transition-all group-hover:border-violet-500/35 group-hover:scale-[1.02] active:scale-[0.98]">
                          <UsersIcon className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="font-semibold text-sm md:text-base tracking-tight">Horarios</span>
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 w-full">
                      <Link href="/crear-reporte" className="flex-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <Button className="w-full h-12 md:h-14 px-8 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] hover:from-[#FF2E75] hover:to-[#FF1A8C] text-white rounded-xl border-0 shadow-lg shadow-rose-500/25 gap-3 text-base md:text-lg font-semibold tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98]">
                          <Plus className="w-5 h-5 md:w-6 md:h-6 stroke-[2px]" />
                          <span>Nuevo reporte</span>
                        </Button>
                      </Link>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.a
                              href="/Manual de Control.pdf"
                              download="Manual de Control.pdf"
                              className="relative group shrink-0"
                              initial="initial"
                              whileHover="hover"
                            >
                              <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <Button variant="outline" asChild className="h-12 md:h-14 border-border/60 bg-card/60 text-muted-foreground hover:text-cyan-400 rounded-xl backdrop-blur-md transition-all group-hover:border-cyan-500/35 overflow-hidden px-3 md:px-4">
                                <motion.div className="flex items-center">
                                  <FileText className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                                  <motion.span
                                    variants={{
                                      initial: { width: 0, opacity: 0, marginLeft: 0 },
                                      hover: { width: "auto", opacity: 1, marginLeft: 10 }
                                    }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="font-medium text-[10px] tracking-wide whitespace-nowrap overflow-hidden"
                                  >
                                    Manual
                                  </motion.span>
                                </motion.div>
                              </Button>
                            </motion.a>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-cyan-500 border-cyan-400 text-[#0f172a] font-medium">
                            <p>Descargar PDF</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
                {loadingReports ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-md bg-muted" />
                          <div className="h-2 w-2 rounded-full bg-muted" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-20 bg-muted rounded" />
                          <div className="h-8 w-12 bg-muted rounded" />
                          <div className="h-2.5 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    ))}

                    <div className="rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse">
                      <div className="h-8 w-8 rounded-md bg-muted" />
                      <div className="space-y-2">
                        <div className="h-2.5 w-24 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-10 w-full bg-muted rounded-md mt-2" />
                      </div>
                    </div>

                    <div className="rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse">
                      <div className="h-8 w-8 rounded-md bg-muted" />
                      <div className="space-y-2">
                        <div className="h-2.5 w-24 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted rounded" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <StatsCard
                      title="Total Reportes"
                      value={stats.totalReports}
                      subtitle={`+${stats.reportsToday} hoy`}
                      icon={<Activity className="w-6 h-6" />}
                      variant="default"
                    />
                    <StatsCard
                      title="Pendientes"
                      value={stats.pendingReports}
                      subtitle="Atención requerida"
                      icon={<Clock className="w-6 h-6" />}
                      variant="danger"
                      valueColor="text-rose-500"
                    />
                    <StatsCard
                      title="Resueltos"
                      value={stats.resolvedReports}
                      subtitle="Cerrados con éxito"
                      icon={<CheckCircle className="w-6 h-6" />}
                      variant="success"
                      valueColor="text-emerald-500"
                    />
                    <LiveActivityCard
                      comments={comments}
                      loading={loadingComments}
                    />
                    <BirthdayWidget users={users} />
                  </>
                )}
              </div>

              {currentUser?.role === 'ENGINEER' && (
                <div className="w-full">
                  <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-sm overflow-hidden rounded-2xl ring-0">
                    <CardHeader>
                      <CardTitle className="text-xl text-foreground flex items-center gap-2 font-semibold tracking-tight">
                        <Activity className="w-5 h-5 text-purple-400" /> Tendencia semanal
                      </CardTitle>
                      <CardDescription className="text-muted-foreground font-medium text-xs">Reportes generados en los últimos 7 días</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[220px] w-full p-4 flex flex-col justify-between relative group">
                        <WeeklyTrendChart loading={loadingReports} chartData={chartData} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div>
                    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-sm overflow-hidden rounded-2xl group ring-0">
                      <CardHeader className="border-b border-border/60 flex flex-row items-center justify-between p-6 relative gap-4">
                        <div className="min-w-0">
                          <CardTitle className="text-xl text-foreground font-semibold tracking-tight">Últimos reportes</CardTitle>
                          <CardDescription className="text-muted-foreground mt-1 font-medium text-xs">Incidencias recientes registradas</CardDescription>
                        </div>
                        <Link href="/reportes" className="shrink-0">
                          <Button variant="ghost" className="text-[#FF0C60] hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 rounded-xl px-4 text-xs font-semibold h-9 transition-all">
                            Ver todos <ArrowUpRight className="ml-1.5 w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        {loadingReports ? (
                          <div className="p-0 space-y-0 animate-pulse">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="flex gap-6 items-center p-6 border-b border-border last:border-0">
                                <div className="w-16 h-3 bg-muted rounded" />
                                <div className="space-y-3 flex-1">
                                  <div className="h-4 w-3/4 bg-muted rounded" />
                                  <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full bg-muted" />
                                    <div className="h-3 w-20 bg-muted rounded" />
                                    <div className="h-4 w-12 bg-muted rounded" />
                                  </div>
                                </div>
                                <div className="w-20 h-6 rounded-md bg-muted" />
                              </div>
                            ))}
                          </div>
                        ) : recentReports.length > 0 ? (
                          <div className="min-w-[600px]">
                            <Table>
                              <TableHeader className="bg-muted/10">
                                <TableRow className="border-border hover:bg-transparent">
                                  <TableHead className="text-muted-foreground pl-6 h-10 font-semibold text-[10px] tracking-tight w-[100px]">ID</TableHead>
                                  <TableHead className="text-muted-foreground h-10 font-semibold text-[10px] tracking-tight">Detalles</TableHead>
                                  <TableHead className="text-muted-foreground h-10 font-semibold text-[10px] tracking-tight w-[150px]">Estado</TableHead>
                                  <TableHead className="text-muted-foreground pr-6 h-10 text-right font-semibold text-[10px] tracking-tight">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {recentReports.map((report) => (
                                  <TableRow key={report.id} className="border-border hover:bg-muted/10 transition-all group/row">
                                    <TableCell className="font-mono text-xs text-muted-foreground pl-6 py-4">
                                      <span className="opacity-50">#</span>{report.id.slice(0, 6)}
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="flex flex-col gap-2">
                                        <div className="font-semibold text-foreground text-sm line-clamp-1 pr-4 tracking-tight">
                                          {report.problemDescription}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground border border-border">
                                              {report.operatorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <span className="text-[11px] font-semibold text-muted-foreground tracking-tight">{report.operatorName.split(' ')[0]}</span>
                                          </div>
                                          <Badge variant="outline" className={`text-[9px] px-2 py-0 border rounded-full font-medium tracking-tight ${report.priority === 'Enlace' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : report.priority === 'EJTV' ? 'bg-[#FF0C60]/10 text-[#FF0C60] border-[#FF0C60]/20' : 'bg-muted text-muted-foreground border-border'}`}>
                                            {report.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="transform scale-90 origin-left">
                                        {getStatusBadge(report.status)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="pr-6 py-4 text-right">
                                      <div className="flex justify-end items-center gap-1 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity">
                                        {report.status !== 'resolved' && (
                                          <Button size="icon" variant="ghost" onClick={(e) => handleResolve(report.id, e)} className="h-8 w-8 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-full transition-all shadow-md hover:shadow-emerald-500/25 focus-visible:opacity-100" title="Marcar como resuelto" aria-label="Marcar como resuelto">
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
                          <div className="py-16 px-6 text-center">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/25" />
                            <p className="text-foreground/80 font-semibold">No hay reportes recientes</p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                              Cuando se registren incidencias, aparecerán aquí. También puedes ver el historial completo en Reportes.
                            </p>
                            <Button asChild className="mt-6 rounded-xl bg-[#FF0C60] hover:bg-[#E00A54] text-white font-semibold shadow-lg shadow-rose-500/20">
                              <Link href="/crear-reporte">Crear reporte</Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div>
                    {loadingUsers ? (
                      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-sm overflow-hidden rounded-2xl ring-0 h-[600px] flex flex-col">
                        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-md bg-muted" />
                            <Skeleton className="h-4 w-32 bg-muted" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                          {Array(7).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 border-l-[3px] border-transparent">
                              <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-1">
                                <Skeleton className="h-2 w-6 bg-muted" />
                                <Skeleton className="h-4 w-4 bg-muted" />
                              </div>
                              <div className="h-8 w-px bg-border" />
                              <div className="flex-1 flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                                <div className="space-y-1.5 flex-1">
                                  <Skeleton className="h-3 w-24 bg-muted" />
                                  <Skeleton className="h-2 w-16 bg-muted" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ) : (
                      <BitcentralWidget users={users} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}