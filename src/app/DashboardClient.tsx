"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Plus, Activity, ArrowUpRight, MessageSquare, FileText } from "lucide-react";


import Link from "next/link";
import { ProcessingModal } from "@/components/ProcessingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon, MonitorPlay } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from
  "@/components/ui/tooltip";


const BitcentralWidget = dynamic(() => import("@/components/BitcentralWidget").then((mod) => mod.BitcentralWidget), {
  loading: () => _jsx(Skeleton, { className: "h-[600px] w-full rounded-md" }),
  ssr: false
});
import { BirthdayWidget } from "@/components/BirthdayWidget"; import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";

export function DashboardClient() {
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    criticalReports: 0,
    reportsToday: 0,
    averageResolutionTime: 0
  });

  const [recentReports, setRecentReports] = useState([]);

  const [modal, setModal] = useState({
    isOpen: false, type: 'success', message: ''
  });
  const [processing] = useState({
    isOpen: false, title: "", message: ""
  });

  const [users, setUsers] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], values: [] });
  const [comments, setComments] = useState([]);


  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const [isPageLoading, setIsPageLoading] = useState(true);

  const { fillPath, linePath } = useMemo(() => {
    if (!chartData.values || chartData.values.length < 2) return { fillPath: '', linePath: '' };
    const max = Math.max(...chartData.values, 5);
    const xStep = 100 / (chartData.values.length - 1);
    const pointsArray = chartData.values.map((val, i) => {
      const x = i * xStep;
      const y = 90 - val / max * 80;
      return `${x},${y}`;
    });
    const points = pointsArray.join(' ');
    const fillPath = `M 0,100 ${points} L 100,100 Z`;
    const linePath = `M ${pointsArray[0]} L ${pointsArray.slice(1).join(' L ')}`;
    return { fillPath, linePath };
  }, [chartData.values]);

  useEffect(() => {
    if (!loadingReports && !loadingUsers) {
      const timer = setTimeout(() => setIsPageLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsPageLoading(true);
    }
  }, [loadingReports, loadingUsers]);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    setLoadingReports(true);
    fetch('/api/reports').
      then((res) => res.json()).
      then((data) => {
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

        const days = [];
        const values = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toLocaleDateString('es-CR', { weekday: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('es-CR', { weekday: 'short' }).slice(1));
          const dayStr = d.toDateString();
          const count = reports.filter((r) => new Date(r.createdAt).toDateString() === dayStr).length;
          values.push(count);
        }
        setChartData({ labels: days, values });
      }).
      catch((err) => console.error("Error fetching reports:", err)).
      finally(() => setLoadingReports(false));

    setLoadingUsers(true);
    fetch('/api/users').
      then((res) => res.json()).
      then((data) => {
        if (Array.isArray(data)) setUsers(data);
      }).
      catch((err) => console.error("Error fetching users:", err)).
      finally(() => setLoadingUsers(false));

    setLoadingComments(true);
    fetch('/api/comments/recent').
      then((res) => res.json()).
      then((data) => {
        if (Array.isArray(data)) setComments(data);
      }).
      catch((err) => console.error("Error fetching comments:", err)).
      finally(() => setLoadingComments(false));
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

  const handleResolve = async (id, e) => {
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

  const getStatusBadge = (status) => {
    const styles = {
      'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
    };
    const labels = { 'resolved': 'Resuelto', 'in-progress': 'En Progreso', 'pending': 'Pendiente' };
    return _jsx(Badge, { variant: "outline", className: `${styles[status] || 'bg-slate-700'} border transition-all duration-300 hover:scale-105`, children: labels[status] || status });
  };

  return (
    _jsxs("div", {
      className: "min-h-screen relative overflow-hidden text-foreground selection:bg-[#FF0C60] selection:text-white pb-20", children: [
        _jsx(ProcessingModal, { isOpen: processing.isOpen, title: processing.title, message: processing.message }),
        _jsx(SuccessModal, { isOpen: modal.isOpen, onClose: () => setModal({ ...modal, isOpen: false }), type: modal.type, message: modal.message }),

        _jsx(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          className: "relative z-10 max-w-[1600px] mx-auto space-y-4 md:space-y-8 p-4 md:p-8 pt-20 md:pt-6", children:

            _jsx(AnimatePresence, {
              mode: "wait", children:
                isPageLoading ?
                  _jsxs(motion.div, {

                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { duration: 0.5 },
                    className: "space-y-10 animate-pulse", children: [

                      _jsxs("div", {
                        className: "flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8 py-12 border-b border-border bg-muted/5 rounded-md p-6 md:p-12", children: [
                          _jsxs("div", {
                            className: "space-y-4 max-w-3xl w-full", children: [
                              _jsx("div", { className: "h-16 w-3/4 bg-muted rounded-md" }),
                              _jsx("div", { className: "h-4 w-1/2 bg-muted rounded-md" })]
                          }
                          ),
                          _jsxs("div", {
                            className: "flex flex-col gap-4 w-full md:w-auto", children: [
                              _jsxs("div", {
                                className: "flex gap-4", children: [
                                  _jsx("div", { className: "h-12 w-32 bg-muted rounded-md" }),
                                  _jsx("div", { className: "h-12 w-32 bg-muted rounded-md" })]
                              }
                              ),
                              _jsxs("div", {
                                className: "flex gap-3", children: [
                                  _jsx("div", { className: "h-14 flex-1 bg-muted rounded-md" }),
                                  _jsx("div", { className: "h-14 w-14 bg-muted rounded-md" })]
                              }
                              )]
                          }
                          )]
                      }
                      ),

                      _jsxs("div", {
                        className: "grid grid-cols-2 lg:grid-cols-4 gap-6", children: [
                          Array(3).fill(0).map((_, i) =>
                            _jsxs("div", {
                              className: "h-[140px] rounded-md bg-card/40 border border-border p-5 space-y-4", children: [
                                _jsx("div", { className: "h-8 w-8 rounded-md bg-muted" }),
                                _jsxs("div", {
                                  className: "space-y-2", children: [
                                    _jsx("div", { className: "h-3 w-20 bg-muted rounded" }),
                                    _jsx("div", { className: "h-8 w-12 bg-muted rounded" })]
                                }
                                )]
                            }, i
                            )
                          ),
                          _jsxs("div", {
                            className: "h-[140px] rounded-md bg-card/40 border border-border p-5 flex flex-col justify-between", children: [
                              _jsx("div", { className: "h-8 w-8 rounded-md bg-muted" }),
                              _jsxs("div", {
                                className: "space-y-2", children: [
                                  _jsx("div", { className: "h-2 w-24 bg-muted rounded" }),
                                  _jsx("div", { className: "h-6 w-full bg-muted rounded-md" })]
                              }
                              )]
                          }
                          )]
                      }
                      ),

                      _jsxs("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-10", children: [
                          _jsx("div", {
                            className: "lg:col-span-2 space-y-10", children:
                              _jsxs("div", {
                                className: "rounded-md border border-border bg-card/40 backdrop-blur-sm overflow-hidden", children: [
                                  _jsxs("div", {
                                    className: "p-6 border-b border-border space-y-2", children: [
                                      _jsx("div", { className: "h-6 w-48 bg-muted rounded" }),
                                      _jsx("div", { className: "h-3 w-64 bg-muted rounded opacity-50" })]
                                  }
                                  ),
                                  _jsx("div", {
                                    className: "p-0", children:
                                      Array(5).fill(0).map((_, i) =>
                                        _jsxs("div", {
                                          className: "flex items-center gap-6 p-6 border-b border-border last:border-0", children: [
                                            _jsx("div", { className: "w-16 h-4 bg-muted rounded opacity-50" }),
                                            _jsxs("div", {
                                              className: "flex-1 space-y-3", children: [
                                                _jsx("div", { className: "h-5 w-3/4 bg-muted rounded" }),
                                                _jsxs("div", {
                                                  className: "flex items-center gap-3", children: [
                                                    _jsx("div", { className: "h-5 w-5 rounded-full bg-muted" }),
                                                    _jsx("div", { className: "h-3 w-20 bg-muted rounded opacity-50" }),
                                                    _jsx("div", { className: "h-4 w-12 rounded bg-muted opacity-30" })]
                                                }
                                                )]
                                            }
                                            ),
                                            _jsx("div", { className: "w-24 h-6 rounded-md bg-muted opacity-40" })]
                                        }, i
                                        )
                                      )
                                  }
                                  )]
                              }
                              )
                          }
                          ),
                          _jsx("div", { className: "lg:col-span-1 h-[600px] rounded-md bg-card/40 border border-border" })]
                      }
                      )]
                  }, "skeleton"
                  ) :

                  _jsxs(motion.div, {

                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { duration: 0.5, ease: "easeOut" },
                    className: "space-y-10", children: [

                      _jsxs("div", {
                        className: "relative z-10 flex flex-col items-start gap-6 md:gap-8 py-6 md:py-12 border-b border-border bg-card/50 backdrop-blur-sm rounded-md p-6 md:p-12 overflow-hidden ring-1 ring-border", children: [
                          _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" }),

                          _jsxs("div", {
                            className: "relative flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-6 md:gap-8", children: [
                              _jsxs("div", {
                                className: "space-y-3 md:space-y-4 max-w-3xl w-full", children: [
                                  _jsx("h1", {
                                    className: "text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight", children:
                                      currentUser?.role === 'ENGINEER' ?
                                        _jsxs(_Fragment, { children: ["Ingenier\xEDa ", _jsx("span", { className: "text-purple-500 font-bold tracking-tighter", children: "Master" })] }) :

                                        _jsxs(_Fragment, { children: ["Control ", _jsx("span", { className: "text-[#FF0C60] font-bold tracking-tighter", children: "Master" })] })
                                  }

                                  ),
                                  _jsx("p", { className: "text-muted-foreground text-sm md:text-base font-medium max-w-lg leading-relaxed border-l-2 border-[#FF0C60]/20 pl-4", children: "Panel de operadores y monitoreo en tiempo real." }

                                  )]
                              }
                              ),

                              _jsxs("div", {
                                className: "flex flex-col items-stretch md:items-end gap-4 w-full md:w-auto", children: [
                                  _jsxs("div", {
                                    className: "grid grid-cols-2 md:flex gap-3 md:gap-4", children: [
                                      _jsxs(Link, {
                                        href: "/operadores/monitoreo", className: "relative group", children: [
                                          _jsx("div", { className: "absolute inset-0 bg-cyan-500/20 rounded-md blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" }),
                                          _jsxs(Button, {
                                            variant: "outline", className: "w-full h-12 md:px-6 border-border bg-card text-muted-foreground hover:text-cyan-400 rounded-md gap-2 md:gap-3 backdrop-blur-md transition-all group-hover:border-cyan-500/30 group-hover:scale-105 active:scale-95", children: [
                                              _jsx(MonitorPlay, { className: "w-4 h-4 md:w-5 md:h-5" }),
                                              _jsx("span", { className: "font-semibold text-sm md:text-base tracking-tight", children: "Monitorear" })]
                                          }
                                          )]
                                      }
                                      ),

                                      _jsxs(Link, {
                                        href: "/operadores", className: "relative group", children: [
                                          _jsx("div", { className: "absolute inset-0 bg-violet-500/20 rounded-md blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" }),
                                          _jsxs(Button, {
                                            variant: "outline", className: "w-full h-12 md:px-6 border-border bg-card text-muted-foreground hover:text-violet-400 rounded-md gap-2 md:gap-3 backdrop-blur-md transition-all group-hover:border-violet-500/30 group-hover:scale-105 active:scale-95", children: [
                                              _jsx(UsersIcon, { className: "w-4 h-4 md:w-5 md:h-5" }),
                                              _jsx("span", { className: "font-semibold text-sm md:text-base tracking-tight", children: "Horarios" })]
                                          }
                                          )]
                                      }
                                      )]
                                  }
                                  ),

                                  _jsxs("div", {
                                    className: "flex items-center gap-3 w-full", children: [
                                      _jsxs(Link, {
                                        href: "/crear-reporte", className: "flex-1 relative group", children: [
                                          _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] rounded-md blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" }),
                                          _jsxs(Button, {
                                            className: "w-full h-12 md:h-14 px-8 bg-gradient-to-r from-[#FF0C60] to-[#FF0080] hover:from-[#FF2E75] hover:to-[#FF1A8C] text-white rounded-md border-0 shadow-lg shadow-rose-500/20 gap-3 text-base md:text-lg font-bold tracking-tight transition-all hover:scale-[1.02] active:scale-95", children: [
                                              _jsx(Plus, { className: "w-5 h-5 md:w-6 md:h-6 stroke-[4]" }),
                                              _jsx("span", { children: "Nuevo Reporte" })]
                                          }
                                          )]
                                      }
                                      ),

                                      _jsx(TooltipProvider, {
                                        children:
                                          _jsxs(Tooltip, {
                                            children: [
                                              _jsx(TooltipTrigger, {
                                                asChild: true, children:
                                                  _jsxs(motion.a, {
                                                    href: "/Manual de Control.pdf",
                                                    download: "Manual de Control.pdf",
                                                    className: "relative group shrink-0",
                                                    initial: "initial",
                                                    whileHover: "hover", children: [

                                                      _jsx("div", { className: "absolute inset-0 bg-cyan-500/20 rounded-md blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" }),
                                                      _jsx(Button, {
                                                        variant: "outline",
                                                        asChild: true,
                                                        className: "h-12 md:h-14 border-border bg-card text-muted-foreground hover:text-cyan-400 rounded-md backdrop-blur-md transition-all group-hover:border-cyan-500/30 overflow-hidden px-3 md:px-4", children:

                                                          _jsxs(motion.div, {
                                                            className: "flex items-center", children: [
                                                              _jsx(FileText, { className: "w-5 h-5 md:w-6 md:h-6 shrink-0" }),
                                                              _jsx(motion.span, {
                                                                variants: {
                                                                  initial: { width: 0, opacity: 0, marginLeft: 0 },
                                                                  hover: { width: "auto", opacity: 1, marginLeft: 10 }
                                                                },
                                                                transition: { duration: 0.3, ease: "easeOut" },
                                                                className: "font-bold text-[10px] tracking-tight whitespace-nowrap overflow-hidden", children:
                                                                  "Manual"
                                                              }

                                                              )]
                                                          }
                                                          )
                                                      }
                                                      )]
                                                  }
                                                  )
                                              }
                                              ),
                                              _jsx(TooltipContent, {
                                                side: "top", className: "bg-cyan-500 border-cyan-400 text-[#0f172a] font-bold", children:
                                                  _jsx("p", { children: "Descargar PDF" })
                                              }
                                              )]
                                          }
                                          )
                                      }
                                      )]
                                  }
                                  )]
                              }
                              )]
                          }
                          )]
                      }
                      ),

                      _jsx("div", {
                        className: "grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6", children:
                          loadingReports ?
                            _jsxs(_Fragment, {
                              children: [
                                [0, 1, 2].map((i) =>
                                  _jsxs("div", {
                                    className: "rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse", children: [
                                      _jsxs("div", {
                                        className: "flex items-center justify-between", children: [
                                          _jsx("div", { className: "h-8 w-8 rounded-md bg-muted" }),
                                          _jsx("div", { className: "h-2 w-2 rounded-full bg-muted" })]
                                      }
                                      ),
                                      _jsxs("div", {
                                        className: "space-y-2", children: [
                                          _jsx("div", { className: "h-3 w-20 bg-muted rounded" }),
                                          _jsx("div", { className: "h-8 w-12 bg-muted rounded" }),
                                          _jsx("div", { className: "h-2.5 w-24 bg-muted rounded" })]
                                      }
                                      )]
                                  }, i
                                  )
                                ),

                                _jsxs("div", {
                                  className: "rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse", children: [
                                    _jsx("div", { className: "h-8 w-8 rounded-md bg-muted" }),
                                    _jsxs("div", {
                                      className: "space-y-2", children: [
                                        _jsx("div", { className: "h-2.5 w-24 bg-muted rounded" }),
                                        _jsx("div", { className: "h-4 w-full bg-muted rounded" }),
                                        _jsx("div", { className: "h-10 w-full bg-muted rounded-md mt-2" })]
                                    }
                                    )]
                                }
                                ),

                                _jsxs("div", {
                                  className: "rounded-md border border-border bg-card/50 p-4 md:p-5 space-y-4 animate-pulse", children: [
                                    _jsx("div", { className: "h-8 w-8 rounded-md bg-muted" }),
                                    _jsxs("div", {
                                      className: "space-y-2", children: [
                                        _jsx("div", { className: "h-2.5 w-24 bg-muted rounded" }),
                                        _jsx("div", { className: "h-4 w-full bg-muted rounded" })]
                                    }
                                    )]
                                }
                                )]
                            }
                            ) :

                            _jsxs(_Fragment, {
                              children: [
                                _jsx(StatsCard, {
                                  title: "Total Reportes",
                                  value: stats.totalReports,
                                  subtitle: `+${stats.reportsToday} hoy`,
                                  icon: _jsx(Activity, { className: "w-6 h-6" }),
                                  variant: "default"
                                }
                                ),
                                _jsx(StatsCard, {
                                  title: "Pendientes",
                                  value: stats.pendingReports,
                                  subtitle: "Atenci\xF3n requerida",
                                  icon: _jsx(Clock, { className: "w-6 h-6" }),
                                  variant: "danger",
                                  valueColor: "text-rose-500"
                                }
                                ),
                                _jsx(StatsCard, {
                                  title: "Resueltos",
                                  value: stats.resolvedReports,
                                  subtitle: "Cerrados con \xE9xito",
                                  icon: _jsx(CheckCircle, { className: "w-6 h-6" }),
                                  variant: "success",
                                  valueColor: "text-emerald-500"
                                }
                                ),
                                _jsx(LiveActivityCard, {
                                  comments: comments,
                                  loading: loadingComments
                                }
                                ),
                                _jsx(BirthdayWidget, { users: users })]
                            }
                            )
                      }

                      ),

                      currentUser?.role === 'ENGINEER' &&
                      _jsx("div", {
                        className: "w-full", children:
                          _jsxs(Card, {
                            className: "bg-card backdrop-blur-md md:backdrop-blur-xl border border-border shadow-sm overflow-hidden rounded-md ring-1 ring-border", children: [
                              _jsxs(CardHeader, {
                                children: [
                                  _jsxs(CardTitle, {
                                    className: "text-xl text-foreground flex items-center gap-2 font-bold tracking-tight", children: [
                                      _jsx(Activity, { className: "w-5 h-5 text-purple-500" }), " Tendencia Semanal"]
                                  }
                                  ),
                                  _jsx(CardDescription, { className: "text-muted-foreground font-medium text-xs", children: "Reportes generados en los \xFAltimos 7 d\xEDas" })]
                              }
                              ),
                              _jsx(CardContent, {
                                children:
                                  _jsx("div", {
                                    className: "h-[220px] w-full p-4 flex flex-col justify-between relative group", children:
                                      loadingReports ?
                                        _jsx("div", {
                                          className: "w-full h-full flex items-end justify-between gap-2", children:
                                            Array(7).fill(0).map((_, i) =>
                                              _jsx(Skeleton, { className: "w-full bg-muted rounded-t-lg", style: { height: `${Math.random() * 80 + 20}%` } }, i)
                                            )
                                        }
                                        ) :

                                        chartData.values.length > 0 ?
                                          _jsxs(_Fragment, {
                                            children: [
                                              _jsxs("div", {
                                                className: "absolute inset-x-4 top-4 bottom-10", children: [
                                                  _jsxs("svg", {
                                                    className: "w-full h-full overflow-visible", preserveAspectRatio: "none", viewBox: "0 0 100 100", children: [
                                                      _jsx("defs", {
                                                        children:
                                                          _jsxs("linearGradient", {
                                                            id: "lineGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                                                              _jsx("stop", { offset: "0%", stopColor: "#22d3ee", stopOpacity: "0.4" }),
                                                              _jsx("stop", { offset: "100%", stopColor: "#22d3ee", stopOpacity: "0" })]
                                                          }
                                                          )
                                                      }
                                                      ),
                                                      _jsx("path", { d: fillPath, fill: "url(#lineGradient)" }),
                                                      _jsx("path", { d: linePath, fill: "none", stroke: "#22d3ee", strokeWidth: "2", vectorEffect: "non-scaling-stroke", strokeLinecap: "round", strokeLinejoin: "round" })]
                                                  }
                                                  ),
                                                  chartData.values.map((val, i) => {
                                                    const max = Math.max(...chartData.values, 5);
                                                    const xPercent = i / (chartData.values.length - 1) * 100;
                                                    const yPercent = 90 - val / max * 80;
                                                    return (
                                                      _jsxs("div", {

                                                        className: "absolute w-4 h-4 -ml-2 -mt-2 group/point flex items-center justify-center cursor-pointer",
                                                        style: { left: `${xPercent}%`, top: `${yPercent}%` }, children: [

                                                          _jsx("div", { className: "absolute inset-0 rounded-full bg-transparent hover:bg-cyan-500/10 transition-colors" }),
                                                          _jsx("div", { className: "w-2 h-2 rounded-full bg-background border-2 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] group-hover/point:scale-150 transition-transform" }),
                                                          _jsx("div", {
                                                            className: "absolute bottom-full mb-2 bg-card text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none", children:
                                                              val
                                                          }
                                                          )]
                                                      }, i
                                                      ));

                                                  })]
                                              }
                                              ),
                                              _jsx("div", {
                                                className: "absolute bottom-2 left-4 right-4 flex justify-between text-[10px] font-semibold text-muted-foreground", children:
                                                  chartData.labels.map((l, i) =>
                                                    _jsx("div", { className: "w-8 text-center", children: l }, i)
                                                  )
                                              }
                                              )]
                                          }
                                          ) :

                                          _jsx("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm", children: "No hay datos suficientes" })
                                  }


                                  )
                              }
                              )]
                          }
                          )
                      }
                      ),


                      _jsxs("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-10", children: [
                          _jsx("div", {
                            className: "lg:col-span-2 space-y-10", children:
                              _jsx("div", {
                                children:
                                  _jsxs(Card, {
                                    className: "bg-card backdrop-blur-md md:backdrop-blur-xl border border-border shadow-sm overflow-hidden rounded-md group ring-1 ring-border", children: [
                                      _jsxs(CardHeader, {
                                        className: "border-b border-border flex flex-row items-center justify-between p-6 relative", children: [
                                          _jsxs("div", {
                                            children: [
                                              _jsx(CardTitle, { className: "text-xl text-foreground font-bold tracking-tight", children: "\xDAltimos Reportes" }),
                                              _jsx(CardDescription, { className: "text-muted-foreground mt-1 font-medium text-xs", children: "Incidencias recientes registradas" })]
                                          }
                                          ),
                                          _jsx(Link, {
                                            href: "/reportes", children:
                                              _jsxs(Button, {
                                                variant: "ghost", className: "text-[#FF0C60] hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 rounded-md px-4 text-xs font-bold h-8 transition-all", children: ["Ver Todos ",
                                                  _jsx(ArrowUpRight, { className: "ml-2 w-3 h-3" })]
                                              }
                                              )
                                          }
                                          )]
                                      }
                                      ),
                                      _jsx(CardContent, {
                                        className: "p-0 overflow-x-auto", children:
                                          loadingReports ?
                                            _jsx("div", {
                                              className: "p-0 space-y-0 animate-pulse", children:
                                                [1, 2, 3, 4, 5].map((i) =>
                                                  _jsxs("div", {
                                                    className: "flex gap-6 items-center p-6 border-b border-border last:border-0", children: [
                                                      _jsx("div", { className: "w-16 h-3 bg-muted rounded" }),
                                                      _jsxs("div", {
                                                        className: "space-y-3 flex-1", children: [
                                                          _jsx("div", { className: "h-4 w-3/4 bg-muted rounded" }),
                                                          _jsxs("div", {
                                                            className: "flex items-center gap-3", children: [
                                                              _jsx("div", { className: "h-5 w-5 rounded-full bg-muted" }),
                                                              _jsx("div", { className: "h-3 w-20 bg-muted rounded" }),
                                                              _jsx("div", { className: "h-4 w-12 bg-muted rounded" })]
                                                          }
                                                          )]
                                                      }
                                                      ),
                                                      _jsx("div", { className: "w-20 h-6 rounded-md bg-muted" })]
                                                  }, i
                                                  )
                                                )
                                            }
                                            ) :

                                            recentReports.length > 0 ?
                                              _jsx("div", {
                                                className: "min-w-[600px]", children:
                                                  _jsxs(Table, {
                                                    children: [
                                                      _jsx(TableHeader, {
                                                        className: "bg-muted/10", children:
                                                          _jsxs(TableRow, {
                                                            className: "border-border hover:bg-transparent", children: [
                                                              _jsx(TableHead, { className: "text-muted-foreground pl-6 h-10 font-semibold text-[10px] tracking-tight w-[100px]", children: "ID" }),
                                                              _jsx(TableHead, { className: "text-muted-foreground h-10 font-semibold text-[10px] tracking-tight", children: "Detalles" }),
                                                              _jsx(TableHead, { className: "text-muted-foreground h-10 font-semibold text-[10px] tracking-tight w-[150px]", children: "Estado" }),
                                                              _jsx(TableHead, { className: "text-muted-foreground pr-6 h-10 text-right font-semibold text-[10px] tracking-tight", children: "Acciones" })]
                                                          }
                                                          )
                                                      }
                                                      ),
                                                      _jsx(TableBody, {
                                                        children:
                                                          recentReports.map((report) =>
                                                            _jsxs(TableRow, {
                                                              className: "border-border hover:bg-muted/10 transition-all group/row", children: [
                                                                _jsxs(TableCell, {
                                                                  className: "font-mono text-xs text-muted-foreground pl-6 py-4", children: [
                                                                    _jsx("span", { className: "opacity-50", children: "#" }), report.id.slice(0, 6)]
                                                                }
                                                                ),
                                                                _jsx(TableCell, {
                                                                  className: "py-4", children:
                                                                    _jsxs("div", {
                                                                      className: "flex flex-col gap-2", children: [
                                                                        _jsx("div", {
                                                                          className: "font-semibold text-foreground text-sm line-clamp-1 pr-4 tracking-tight", children:
                                                                            report.problemDescription
                                                                        }
                                                                        ),
                                                                        _jsxs("div", {
                                                                          className: "flex items-center gap-3", children: [
                                                                            _jsxs("div", {
                                                                              className: "flex items-center gap-2", children: [
                                                                                _jsx("div", {
                                                                                  className: "w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border border-border", children:
                                                                                    report.operatorName.split(' ').map((n) => n[0]).join('').substring(0, 2)
                                                                                }
                                                                                ),
                                                                                _jsx("span", { className: "text-[11px] font-semibold text-muted-foreground tracking-tight", children: report.operatorName.split(' ')[0] })]
                                                                            }
                                                                            ),
                                                                            _jsx(Badge, {
                                                                              variant: "outline", className: `text-[9px] px-2 py-0 border rounded-full font-bold tracking-tight ${report.priority === 'Enlace' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : report.priority === 'EJTV' ? 'bg-[#FF0C60]/10 text-[#FF0C60] border-[#FF0C60]/20' : 'bg-muted text-muted-foreground border-border'}`, children:
                                                                                report.priority
                                                                            }
                                                                            )]
                                                                        }
                                                                        )]
                                                                    }
                                                                    )
                                                                }
                                                                ),
                                                                _jsx(TableCell, {
                                                                  className: "py-4", children:
                                                                    _jsx("div", { className: "transform scale-90 origin-left", children: getStatusBadge(report.status) })
                                                                }
                                                                ),
                                                                _jsx(TableCell, {
                                                                  className: "pr-6 py-4 text-right", children:
                                                                    _jsx("div", {
                                                                      className: "flex justify-end items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity", children:
                                                                        report.status !== 'resolved' &&
                                                                        _jsx(Button, {
                                                                          size: "icon", variant: "ghost", onClick: (e) => handleResolve(report.id, e), className: "h-8 w-8 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-full transition-all shadow-lg hover:shadow-emerald-500/20", title: "Resolver", children:
                                                                            _jsx(CheckCircle, { className: "w-4 h-4" })
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
                                              ) :

                                              _jsxs("div", {
                                                className: "py-16 text-center text-muted-foreground font-medium", children: [
                                                  _jsx(Activity, { className: "w-12 h-12 mx-auto mb-4 opacity-20" }),
                                                  _jsx("p", { children: "No hay reportes recientes." })]
                                              }
                                              )
                                      }


                                      )]
                                  }
                                  )
                              }
                              )
                          }
                          ),
                          _jsx("div", {
                            className: "lg:col-span-1", children:
                              _jsx("div", {
                                children:
                                  loadingUsers ?
                                    _jsxs(Card, {
                                      className: "bg-card backdrop-blur-xl border-border shadow-sm overflow-hidden ring-1 ring-border h-[600px] flex flex-col", children: [
                                        _jsx(CardHeader, {
                                          className: "p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0", children:
                                            _jsxs("div", {
                                              className: "flex items-center gap-3", children: [
                                                _jsx(Skeleton, { className: "h-8 w-8 rounded-md bg-muted" }),
                                                _jsx(Skeleton, { className: "h-4 w-3/32 bg-muted" })]
                                            }
                                            )
                                        }
                                        ),
                                        _jsx(CardContent, {
                                          className: "p-0 flex-1 flex flex-col", children:
                                            Array(7).fill(0).map((_, i) =>
                                              _jsxs("div", {
                                                className: "flex items-center gap-3 p-3 border-l-[3px] border-transparent", children: [
                                                  _jsxs("div", {
                                                    className: "flex flex-col items-center justify-center w-12 shrink-0 gap-1", children: [
                                                      _jsx(Skeleton, { className: "h-2 w-6 bg-muted" }),
                                                      _jsx(Skeleton, { className: "h-4 w-4 bg-muted" })]
                                                  }
                                                  ),
                                                  _jsx("div", { className: "h-8 w-px bg-border" }),
                                                  _jsxs("div", {
                                                    className: "flex-1 flex items-center gap-3", children: [
                                                      _jsx(Skeleton, { className: "h-8 w-8 rounded-full bg-muted" }),
                                                      _jsxs("div", {
                                                        className: "space-y-1.5 flex-1", children: [
                                                          _jsx(Skeleton, { className: "h-3 w-24 bg-muted" }),
                                                          _jsx(Skeleton, { className: "h-2 w-16 bg-muted" })]
                                                      }
                                                      )]
                                                  }
                                                  )]
                                              }, i
                                              )
                                            )
                                        }
                                        )]
                                    }
                                    ) :

                                    _jsx(BitcentralWidget, { users: users })
                              }

                              )
                          }
                          )]
                      }
                      )]
                  }, "content"
                  )
            }

            )
        }
        )]
    }
    ));

}

function LiveActivityCard({ comments, loading }) {
  const latestComment = comments[0];
  return (
    _jsx(Card, {
      className: "border-border bg-card/40 backdrop-blur-sm border transition-all duration-300 hover:border-[#FF0C60]/30 rounded-md overflow-hidden group", children:
        _jsxs(CardContent, {
          className: "p-4 md:p-5 h-full flex flex-col justify-between", children: [
            _jsxs("div", {
              className: "flex items-center justify-between mb-3", children: [
                _jsx("div", { className: "p-2 rounded-md bg-[#FF0C60]/10 text-[#FF0C60]", children: _jsx(MessageSquare, { className: "w-5 h-5" }) }),
                _jsxs("span", {
                  className: "flex h-2 w-2 relative", children: [
                    _jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0C60] opacity-75" }),
                    _jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-[#FF0C60]" })]
                }
                )]
            }
            ),
            _jsxs("div", {
              className: "space-y-1.5 flex-1 min-w-0", children: [
                _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground flex items-center gap-2", children: "Comentarios recientes" }),
                loading ?
                  _jsxs("div", {
                    className: "space-y-2", children: [
                      _jsx(Skeleton, { className: "h-3 w-2/3" }),
                      _jsx(Skeleton, { className: "h-8 w-full" })]
                  }
                  ) :
                  latestComment ?
                    _jsxs("div", {
                      className: "space-y-2", children: [
                        _jsxs("div", {
                          className: "flex items-center gap-2", children: [
                            _jsx("div", { className: "w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground", children: latestComment.author?.name?.[0] }),
                            _jsxs("span", { className: "text-[11px] font-medium text-foreground truncate", children: [latestComment.author?.name.split(' ')[0], " coment\xF3:"] })]
                        }
                        ),
                        _jsxs("p", { className: "text-xs text-muted-foreground line-clamp-2 italic leading-relaxed", children: ["\"", latestComment.content, "\""] }),
                        _jsxs("div", {
                          className: "flex items-center justify-between mt-auto pt-1", children: [
                            _jsxs("span", { className: "text-[9px] text-slate-500 font-medium", children: ["#", latestComment.report?.id?.slice(0, 6)] }),
                            _jsx(Link, { href: "/reportes", className: "text-[9px] text-[#FF0C60] font-semibold hover:underline", children: "Ver reporte" })]
                        }
                        )]
                    }
                    ) :

                    _jsx("p", { className: "text-xs text-muted-foreground italic", children: "Sin actividad reciente" })]
            }

            )]
        }
        )
    }
    ));

}

function StatsCard({ title, value, subtitle, icon, valueColor = "text-foreground", variant = 'default' }) {
  const variants = {
    default: "border-blue-500/30 bg-blue-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-orange-500/30 bg-orange-500/5",
    danger: "border-rose-500/30 bg-rose-500/5"
  };
  const iconColors = {
    default: "text-blue-500 bg-blue-500/10",
    success: "text-emerald-500 bg-emerald-500/10",
    warning: "text-orange-500 bg-orange-500/10",
    danger: "text-rose-500 bg-rose-500/10"
  };
  return (
    _jsx(Card, {
      className: `${variants[variant]} backdrop-blur-sm border transition-all duration-200 hover:border-opacity-50 rounded-md overflow-hidden`, children:
        _jsxs(CardContent, {
          className: "p-4 md:p-5", children: [
            _jsxs("div", {
              className: "flex items-center justify-between mb-4", children: [
                _jsx("div", { className: `p-2 rounded-md ${iconColors[variant]}`, children: icon }),
                variant === 'danger' && value > 0 &&
                _jsxs("span", {
                  className: "flex h-2 w-2 relative", children: [
                    _jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" }),
                    _jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-rose-500" })]
                }
                )]
            }

            ),
            _jsxs("div", {
              className: "space-y-1", children: [
                _jsx("p", { className: "text-xs font-medium text-muted-foreground tracking-tight", children: title }),
                _jsx("h3", { className: `text-2xl md:text-3xl font-bold ${valueColor}`, children: value }),
                _jsx("p", { className: "text-xs text-muted-foreground", children: subtitle })]
            }
            )]
        }
        )
    }
    ));

}