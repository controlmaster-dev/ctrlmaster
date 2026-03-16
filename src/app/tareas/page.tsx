"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle, Plus, Trash2, Clock, Layout, ListTodo, MessageSquare, CheckCircle
} from
  "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/ConfirmModal"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email === 'knunez@enlace.org' || user?.email === 'ablanco@enlace.org' || user?.role === 'BOSS';

  const [activeTab, setActiveTab] = useState("my-agenda");


  useEffect(() => {
    if (!user) return;
    if (user.role === 'ENGINEER') { router.push('/'); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  if (isAdmin) {

    return (
      _jsxs("div", {
        className: "min-h-screen relative", children: [

          _jsxs("div", {
            className: "fixed inset-0 pointer-events-none", children: [
              _jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '4000ms' } }),
              _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '7000ms' } })]
          }
          ),

          _jsxs("div", {
            className: "p-4 md:p-8 pt-20 md:pt-6 max-w-[1600px] mx-auto relative z-10", children: [
              _jsxs("div", {
                className: "flex items-center justify-between mb-8", children: [
                  _jsx("h1", {
                    className: "text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter", children:
                      activeTab === 'manage' ? 'Gestión de Equipos' : 'Mis Tareas'
                  }
                  ),
                  _jsxs("div", {
                    className: "flex items-center gap-2", children: [

                      _jsxs("div", {
                        className: "bg-black/40 p-1 rounded-2xl flex gap-1 border border-white/5 backdrop-blur-xl", children: [
                          _jsxs("button", {
                            onClick: () => setActiveTab('manage'),
                            className: `px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'manage' ? 'bg-white/10 text-[#FF0C60] shadow-lg backdrop-blur-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`, children: [

                              _jsx(Layout, { className: "w-4 h-4 inline mr-2" }), "Gestionar"]
                          }

                          ),
                          _jsxs("button", {
                            onClick: () => setActiveTab('my-agenda'),
                            className: `px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'my-agenda' ? 'bg-white/10 text-[#FF0C60] shadow-lg backdrop-blur-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`, children: [

                              _jsx(ListTodo, { className: "w-4 h-4 inline mr-2" }), "Mi Agenda"]
                          }

                          )]
                      }
                      ), "        "]
                  })]
              }
              ),

              _jsxs(AnimatePresence, {
                mode: "wait", children: [
                  activeTab === 'manage' &&
                  _jsx(motion.div, {

                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 20 },
                    className: "h-full", children:

                      _jsx(AdminView, { user: user })
                  }, "manage"
                  ),

                  activeTab === 'my-agenda' &&
                  _jsx(motion.div, {

                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 }, children:

                      _jsx(OperatorView, { user: user })
                  }, "agenda"
                  )]
              }

              )]
          }
          )]
      }
      ));

  }


  return (
    _jsxs("div", {
      className: "min-h-screen relative", children: [
        _jsxs("div", {
          className: "fixed inset-0 pointer-events-none", children: [
            _jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '4000ms' } }),
            _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '7000ms' } })]
        }
        ),
        _jsx("div", {
          className: "p-4 md:p-8 pt-20 md:pt-6 relative z-10", children:
            _jsx(OperatorView, { user: user })
        }
        )]
    }
    ));

}



function OperatorView({ user }: { user: { id: string; name: string; role: string } }) {



  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);


  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);


  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState("");
  const [actionType, setActionType] = useState('VIEW');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    setWeekDates(days);
  }, []);

  const loadData = async (date) => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      const res = await fetch(`/api/tasks?userId=${user.id}&date=${dateStr}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error("API returned invalid data format:", data);
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, selectedDate]);

  const handleAction = async () => {
    if (!selectedTask) return;


    let status = undefined;
    if (actionType === 'COMPLETE') status = 'COMPLETED';
    if (actionType === 'JUSTIFY') status = 'INCOMPLETE';


    await fetch('/api/tasks', {
      method: 'PATCH',
      body: JSON.stringify({
        id: selectedTask.id,
        status: status,
        comment: comment
      })
    });
    setIsModalOpen(false);
    loadData(selectedDate);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setComment(task.comment || "");

    if (task.status === 'PENDING') setActionType('VIEW'); else
      setActionType('EDIT');
    setIsModalOpen(true);
  };

  const isToday = (d) => {
    const now = new Date();
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  };

  const isSelectedDateToday = isToday(selectedDate);
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? completedCount / tasks.length * 100 : 0;


  const getDayName = (d) => format(d, 'EEE', { locale: es }).replace('.', '');
  const getDayNumber = (d) => format(d, 'd');

  if (loading && tasks.length === 0) return _jsx("div", { className: "text-center p-10 font-mono text-slate-400", children: "Cargando..." });

  return (
    _jsxs("div", {
      className: "max-w-5xl mx-auto space-y-8", children: [

        _jsxs("div", {
          className: "space-y-6", children: [
            _jsxs("div", {
              children: [
                _jsxs("h2", {
                  className: "text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter", children: ["Hola, ",
                    user.name.split(' ')[0]]
                }
                ),
                _jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Agenda Semanal" }

                )]
            }
            ),


            _jsx("div", {
              className: "grid grid-cols-7 bg-gradient-to-b from-white/5 via-black/5 to-black/40 p-2 rounded-3xl shadow-2xl border border-white/5 gap-2 backdrop-blur-xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]", children:
                weekDates.map((d) => {
                  const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth();
                  const today = isToday(d);

                  return (
                    _jsxs("button", {

                      onClick: () => setSelectedDate(d),
                      className: `
                                    flex flex-col items-center justify-center w-full h-24 rounded-2xl transition-all relative
                                    ${isSelected ?
                          'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/30 scale-105 z-10' :
                          'text-slate-500 hover:bg-white/10 hover:text-slate-200'}
                                `, children: [


                        _jsx("span", { className: "text-[10px] font-bold tracking-wider opacity-80", children: getDayName(d) }),
                        _jsx("span", { className: "text-xl font-bold", children: getDayNumber(d) }),
                        today &&
                        _jsx("div", { className: `absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FF0C60]'}` })]
                    }, format(d, 'yyyy-MM-dd')

                    ));

                })
            }
            ),


            isSelectedDateToday &&
            _jsxs("div", {
              className: "space-y-2", children: [
                _jsxs("div", {
                  className: "flex justify-between text-xs font-bold tracking-tight text-slate-400", children: [
                    _jsx("span", { children: "Progreso Diario" }),
                    _jsxs("span", { children: [Math.round(progress), "%"] })]
                }
                ),
                _jsx("div", {
                  className: "h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5", children:
                    _jsx(motion.div, {
                      initial: { width: 0 },
                      animate: { width: `${progress}%` },
                      className: "h-full bg-gradient-to-r from-[#FF0C60] to-orange-500"
                    }
                    )
                }
                )]
            }
            )]
        }

        ),


        _jsxs(Tabs, {
          defaultValue: "pending", className: "w-full", children: [
            _jsxs(TabsList, {
              className: "grid w-full grid-cols-3 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-xl", children: [
                _jsxs(TabsTrigger, {
                  value: "pending", className: "rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-[#FF0C60] data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300", children: ["Pendientes (",
                    tasks.filter((t) => t.status === 'PENDING').length, ")"]
                }
                ),
                _jsxs(TabsTrigger, {
                  value: "completed", className: "rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300", children: ["Completadas (",
                    tasks.filter((t) => t.status === 'COMPLETED').length, ")"]
                }
                ),
                _jsxs(TabsTrigger, {
                  value: "justified", className: "rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-amber-500 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300", children: ["Justificadas (",
                    tasks.filter((t) => t.status === 'INCOMPLETE').length, ")"]
                }
                )]
            }
            ),

            _jsxs("div", {
              className: "pb-24", children: [
                !isSelectedDateToday &&
                _jsxs("div", {
                  className: "p-4 bg-white/5 rounded-2xl text-center text-slate-500 text-xs font-medium mb-4 border border-dashed border-white/20 mx-1", children: ["Vista Hist\xF3rica: ",
                    format(selectedDate, "d 'de' MMMM", { locale: es })]
                }
                ),


                _jsx(TabsContent, {
                  value: "pending", className: "space-y-3 mt-0 focus-visible:ring-0 outline-none", children:
                    tasks.filter((t) => t.status === 'PENDING').length === 0 ?
                      _jsxs("div", {
                        className: "flex flex-col items-center justify-center py-16 opacity-50", children: [
                          _jsx("div", {
                            className: "bg-white/5 p-4 rounded-full mb-3 border border-white/5", children:
                              _jsx(CheckCircle, { className: "w-8 h-8 text-slate-300" })
                          }
                          ),
                          _jsx("p", { className: "text-sm font-medium", children: "\xA1Todo listo por hoy!" })]
                      }
                      ) :

                      tasks.filter((t) => t.status === 'PENDING').map((task) =>
                        _jsx(TaskCard, {

                          task: task,
                          isToday: isSelectedDateToday,
                          onClick: () => {
                            if (isSelectedDateToday) {
                              openTaskModal(task);
                            }
                          }
                        }, task.id
                        )
                      )
                }

                ),

                _jsx(TabsContent, {
                  value: "completed", className: "space-y-3 mt-0 focus-visible:ring-0 outline-none", children:
                    tasks.filter((t) => t.status === 'COMPLETED').length === 0 ?
                      _jsx("div", {
                        className: "text-center py-16 opacity-40", children:
                          _jsx("p", { className: "text-xs", children: "No hay tareas completadas a\xFAn." })
                      }
                      ) :

                      tasks.filter((t) => t.status === 'COMPLETED').map((task) =>
                        _jsx(TaskCard, {
                          task: task, isToday: isSelectedDateToday, isCompleted: true,
                          onClick: () => openTaskModal(task)
                        }, task.id
                        )
                      )
                }

                ),

                _jsx(TabsContent, {
                  value: "justified", className: "space-y-3 mt-0 focus-visible:ring-0 outline-none", children:
                    tasks.filter((t) => t.status === 'INCOMPLETE').length === 0 ?
                      _jsx("div", {
                        className: "text-center py-16 opacity-40", children:
                          _jsx("p", { className: "text-xs", children: "No hay tareas justificadas." })
                      }
                      ) :

                      tasks.filter((t) => t.status === 'INCOMPLETE').map((task) =>
                        _jsx(TaskCard, {
                          task: task, isToday: isSelectedDateToday, isCompleted: true,
                          onClick: () => openTaskModal(task)
                        }, task.id
                        )
                      )
                }

                )]
            }
            )]
        }
        ),


        _jsx(Dialog, {
          open: isModalOpen, onOpenChange: setIsModalOpen, children:
            _jsxs(DialogContent, {
              className: "sm:max-w-md", children: [
                _jsxs(DialogHeader, {
                  children: [
                    _jsxs(DialogTitle, {
                      className: "flex items-center gap-2", children: [
                        actionType === 'COMPLETE' && _jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }),
                        actionType === 'JUSTIFY' && _jsx(AlertCircle, { className: "w-5 h-5 text-amber-500" }),
                        actionType === 'EDIT' && _jsx(MessageSquare, { className: "w-5 h-5 text-blue-500" }),
                        actionType === 'VIEW' && _jsx(ListTodo, { className: "w-5 h-5 text-slate-500" }),

                        selectedTask?.title]
                    }
                    ),
                    _jsx(DialogDescription, {
                      children:
                        selectedTask?.description || "Sin descripción adicional."
                    }
                    )]
                }
                ),


                actionType === 'VIEW' &&
                _jsxs("div", {
                  className: "grid grid-cols-2 gap-3 py-4", children: [
                    _jsxs(Button, {
                      className: "bg-emerald-500 hover:bg-emerald-600 text-white h-24 flex flex-col gap-2 shadow-lg shadow-emerald-500/20",
                      onClick: () => setActionType('COMPLETE'), children: [

                        _jsx(CheckCircle, { className: "w-8 h-8" }),
                        _jsx("span", { className: "font-bold", children: "Confirmar" }),
                        _jsx("span", { className: "text-[10px] opacity-80 font-normal", children: "Tarea Realizada" })]
                    }
                    ),

                    _jsxs(Button, {
                      variant: "secondary",
                      className: "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 text-amber-600 dark:text-amber-500 h-24 flex flex-col gap-2 border border-amber-200 dark:border-amber-800",
                      onClick: () => {
                        setComment("");
                        setActionType('JUSTIFY');
                      }, children: [

                        _jsx(AlertCircle, { className: "w-8 h-8" }),
                        _jsx("span", { className: "font-bold", children: "Justificar" }),
                        _jsx("span", { className: "text-[10px] opacity-80 font-normal", children: "No se pudo realizar" })]
                    }
                    )]
                }
                ),



                actionType !== 'VIEW' &&
                _jsxs("div", {
                  className: "space-y-4 py-2", children: [
                    _jsxs("div", {
                      className: "bg-slate-50 dark:bg-white/5 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300", children: [
                        actionType === 'COMPLETE' && "Añade un comentario opcional sobre la ejecución.",
                        actionType === 'JUSTIFY' && "Es obligatorio indicar por qué no se pudo realizar la tarea.",
                        actionType === 'EDIT' && "Modifica el comentario de esta tarea."]
                    }
                    ),

                    _jsx(Textarea, {
                      autoFocus: true,
                      placeholder: actionType === 'JUSTIFY' ? "Motivo de la justificación..." : "Observaciones...",
                      value: comment,
                      onChange: (e) => setComment(e.target.value),
                      className: "min-h-[100px]"
                    }
                    )]
                }
                ),


                _jsxs(DialogFooter, {
                  className: "gap-2 sm:gap-0", children: [
                    actionType !== 'VIEW' &&
                    _jsx(Button, {
                      variant: "ghost", onClick: () => {

                        if (selectedTask?.status === 'PENDING') setActionType('VIEW'); else
                          setIsModalOpen(false);
                      }, children: "Atr\xE1s"
                    }

                    ),


                    actionType !== 'VIEW' &&
                    _jsx(Button, {
                      onClick: handleAction,
                      disabled: actionType === 'JUSTIFY' && comment.trim().length < 5,
                      className: `
                                    ${actionType === 'COMPLETE' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                    ${actionType === 'JUSTIFY' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    ${actionType === 'EDIT' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                    text-white
                                `, children:

                        actionType === 'EDIT' ? 'Guardar Cambios' : 'Confirmar'
                    }
                    )]
                }

                )]
            }
            )
        }
        )]
    }
    ));

}

function AdminView({ user: _user }: { user: { id: string; name: string; role: string } }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [tasks, setTasks] = useState([]);


  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [newTasks, setNewTasks] = useState([{ title: "", priority: "MEDIUM", deadline: "" }]);



  useEffect(() => {




    setSelectedDays([new Date()]);
  }, []);


  const [taskToDelete, setTaskToDelete] = useState(null);

  const [viewComment, setViewComment] = useState(null);

  useEffect(() => {
    const init = async () => {
      const uRes = await fetch('/api/users');
      const uData = await uRes.json();
      setUsers(uData);
      if (uData.length > 0) setSelectedUserId(uData[0].id);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedUserId) {

      fetch(`/api/tasks?userId=${selectedUserId}`).
        then((r) => r.json()).
        then(setTasks);
    }
  }, [selectedUserId]);

  const handleSave = async () => {
    if (!selectedUserId) return;
    const valid = newTasks.filter((t) => t.title.trim() !== "");
    if (valid.length === 0 || selectedDays.length === 0) return;

    await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        userId: selectedUserId,
        tasks: valid,
        dates: selectedDays.map((d) => format(d, 'yyyy-MM-dd'))
      })
    });
    setIsAddOpen(false);
    setNewTasks([{ title: "", priority: "MEDIUM", deadline: "" }]);
    setSelectedDays([new Date()]);


    const res = await fetch(`/api/tasks?userId=${selectedUserId}`);
    setTasks(await res.json());
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    await fetch(`/api/tasks?id=${taskToDelete}`, { method: 'DELETE' });
    setTaskToDelete(null);

    if (selectedUserId) {
      const res = await fetch(`/api/tasks?userId=${selectedUserId}`);
      setTasks(await res.json());
    }
  };

  const toggleDay = (d) => {
    const str = format(d, 'yyyy-MM-dd');
    const exists = selectedDays.find((sd) => format(sd, 'yyyy-MM-dd') === str);
    if (exists) {
      setSelectedDays(selectedDays.filter((sd) => format(sd, 'yyyy-MM-dd') !== str));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };


  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportEmails, setReportEmails] = useState("knunez@enlace.org");
  const [sendingReport, setSendingReport] = useState(false);

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const emails = reportEmails.split(',').map((e) => e.trim()).filter((e) => e.length > 0);
      await fetch('/api/cron/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      });
      setIsReportOpen(false);
      alert("Reporte enviado correctamente.");
    } catch (e) {
      alert("Error enviando reporte.");
    } finally {
      setSendingReport(false);
    }
  };

  const selectedUserName = users.find((u) => u.id === selectedUserId)?.name;

  const getPriorityColor = (p) => {
    switch (p) {
      case 'HIGH': return 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'MEDIUM': return 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      default: return 'border-slate-200 text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };




  const sortedTasks = [...tasks].sort((a, b) => {
    const dA = parseISO(a.scheduledDate); const dB = parseISO(b.scheduledDate);
    return (isValid(dB) ? dB.getTime() : 0) - (isValid(dA) ? dA.getTime() : 0);
  });

  return (
    _jsxs("div", {
      className: "flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]", children: [
        _jsx(ConfirmModal, {
          isOpen: !!taskToDelete,
          title: "\xBFEliminar Tarea?",
          message: "Esta acci\xF3n no se puede deshacer. La tarea desaparecer\xE1 de la lista del operador para este d\xEDa.",
          onConfirm: handleDelete,
          onCancel: () => setTaskToDelete(null)
        }
        ),

        _jsx(Dialog, {
          open: !!viewComment, onOpenChange: (open) => !open && setViewComment(null), children:
            _jsxs(DialogContent, {
              children: [
                _jsxs(DialogHeader, {
                  children: [
                    _jsxs(DialogTitle, {
                      className: "flex items-center gap-2", children: [
                        _jsx(MessageSquare, { className: "w-5 h-5 text-blue-500" }),
                        viewComment?.title]
                    }
                    ),
                    _jsx(DialogDescription, { children: "Observaciones / Justificaci\xF3n" })]
                }
                ),
                _jsxs("div", {
                  className: "p-6 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-700 dark:text-slate-300 italic border border-slate-100 dark:border-white/5", children: ["\"",
                    viewComment?.comment, "\""]
                }
                ),
                _jsx(DialogFooter, {
                  children:
                    _jsx(Button, { onClick: () => setViewComment(null), children: "Cerrar" })
                }
                )]
            }
            )
        }
        ),


        _jsxs(Card, {
          className: "w-full md:w-80 h-full flex flex-col border border-white/5 shadow-2xl bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl rounded-3xl overflow-hidden ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]", children: [
            _jsx(CardHeader, {
              className: "pb-4 border-b border-white/5", children:
                _jsx(CardTitle, { className: "flex items-center gap-2 text-sm text-slate-500", children: "Equipos" }

                )
            }
            ),
            _jsx(ScrollArea, {
              className: "flex-1", children:
                _jsx("div", {
                  className: "p-2 space-y-1", children:
                    users.filter((u) => u.role === 'OPERATOR').map((u) =>
                      _jsxs("button", {

                        onClick: () => setSelectedUserId(u.id),
                        className: `w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedUserId === u.id ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/30' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`, children: [

                          _jsx("div", {
                            className: `w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedUserId === u.id ? 'bg-white/20' : 'bg-white/5 text-slate-500'}`, children:
                              u.name[0]
                          }
                          ),
                          _jsx("span", { className: "font-medium truncate", children: u.name })]
                      }, u.id
                      )
                    )
                }
                )
            }
            )]
        }
        ),


        _jsxs("div", {
          className: "flex-1 flex flex-col h-full space-y-6", children: [
            _jsxs("div", {
              className: "flex justify-between items-end", children: [
                _jsxs("div", {
                  children: [
                    _jsxs("h2", {
                      className: "text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3", children: [
                        _jsx(ListTodo, { className: "w-8 h-8 text-slate-400" }),
                        selectedUserName]
                    }
                    ),
                    _jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Plan de trabajo." })]
                }
                ),

                _jsx("div", {
                  className: "flex gap-2", children:
                    _jsx(Button, { variant: "outline", className: "h-12 border-slate-200 dark:border-white/10", onClick: () => setIsReportOpen(true), children: "Reporte Semanal" }

                    )
                }
                ),

                _jsxs(Dialog, {
                  open: isAddOpen, onOpenChange: setIsAddOpen, children: [
                    _jsx(DialogTrigger, {
                      asChild: true, children:
                        _jsxs(Button, {
                          className: "bg-[#FF0C60] hover:bg-[#D90A50] text-white shadow-lg shadow-[#FF0C60]/20 rounded-xl px-6 h-12", children: [
                            _jsx(Plus, { className: "w-5 h-5 mr-2" }), " Planificar"]
                        }
                        )
                    }
                    ),
                    _jsxs(DialogContent, {
                      className: "max-w-3xl", children: [

                        _jsx(DialogHeader, {
                          children:
                            _jsxs(DialogTitle, { children: ["Planificar para ", selectedUserName] })
                        }
                        ),
                        _jsxs("div", {
                          className: "py-4 space-y-4 max-h-[70vh] overflow-y-auto", children: [



                            _jsxs("div", {
                              className: "space-y-4", children: [
                                _jsxs("div", {
                                  className: "flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-lg", children: [
                                    _jsxs("div", {
                                      className: "space-y-1", children: [
                                        _jsx(Label, { children: "Fechas de Planificaci\xF3n" }),
                                        _jsx("p", { className: "text-[11px] text-slate-500", children: "Selecciona los d\xEDas para asignar estas tareas. (Mostrando pr\xF3ximas 8 semanas)" })]
                                    }
                                    ),
                                    _jsx("div", {
                                      className: "flex gap-2", children:
                                        _jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-xs", onClick: () => setSelectedDays([]), children: "Limpiar" })
                                    }
                                    )]
                                }
                                ),


                                _jsx("div", {
                                  className: "space-y-6", children:
                                    Array.from({ length: 8 }).map((_, weekIndex) => {

                                      const today = new Date();
                                      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
                                      const weekStart = addDays(startOfCurrentWeek, weekIndex * 7);


                                      const weekDays = Array.from({ length: 7 }).map((_, dayIndex) => addDays(weekStart, dayIndex));


                                      const allSelected = weekDays.every((d) =>
                                        selectedDays.some((sd) => format(sd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
                                      );

                                      return (
                                        _jsxs("div", {
                                          className: "space-y-2", children: [
                                            _jsxs("div", {
                                              className: "flex items-center gap-2", children: [
                                                _jsxs("h4", {
                                                  className: "text-xs font-bold text-slate-400", children: ["Semana ",
                                                    format(weekStart, 'd MMM'), " - ", format(addDays(weekStart, 6), 'd MMM', { locale: es })]
                                                }
                                                ),
                                                _jsx(Button, {
                                                  variant: "ghost",
                                                  size: "sm",
                                                  className: `h-5 text-[10px] px-2 ${allSelected ? 'text-red-500' : 'text-blue-500'}`,
                                                  onClick: () => {
                                                    if (allSelected) {

                                                      const toRemove = weekDays.map((d) => format(d, 'yyyy-MM-dd'));
                                                      setSelectedDays(selectedDays.filter((sd) => !toRemove.includes(format(sd, 'yyyy-MM-dd'))));
                                                    } else {

                                                      const existing = selectedDays.map((d) => format(d, 'yyyy-MM-dd'));
                                                      const newDays = weekDays.filter((d) => !existing.includes(format(d, 'yyyy-MM-dd')));
                                                      setSelectedDays([...selectedDays, ...newDays]);
                                                    }
                                                  }, children:

                                                    allSelected ? 'Deseleccionar' : 'Seleccionar Todo'
                                                }
                                                )]
                                            }
                                            ),
                                            _jsx("div", {
                                              className: "grid grid-cols-7 gap-1", children:
                                                weekDays.map((d) => {
                                                  const s = format(d, 'yyyy-MM-dd');
                                                  const isSel = selectedDays.some((sd) => format(sd, 'yyyy-MM-dd') === s);
                                                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                                                  return (
                                                    _jsxs("button", {

                                                      onClick: () => toggleDay(d),
                                                      className: `
                                                                        flex flex-col items-center justify-center p-2 rounded-lg transition-all border
                                                                        ${isSel ?
                                                          'bg-[#FF0C60] text-white border-[#FF0C60] shadow-md shadow-[#FF0C60]/20' :
                                                          'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'}
                                                                        ${isWeekend && !isSel ? 'bg-slate-50 opacity-70' : ''}
                                                                    `, children: [

                                                        _jsx("span", { className: "text-[9px] opacity-70 mb-0.5", children: format(d, 'EEE', { locale: es }) }),
                                                        _jsx("span", { className: "text-sm font-bold", children: format(d, 'd') })]
                                                    }, s
                                                    ));

                                                })
                                            }
                                            )]
                                        }, weekIndex
                                        ));

                                    })
                                }
                                )]
                            }
                            ),

                            _jsxs("div", {
                              className: "space-y-3 pt-4 border-t", children: [
                                newTasks.map((t, idx) =>
                                  _jsxs("div", {
                                    className: "flex gap-2 items-start", children: [
                                      _jsxs("div", {
                                        className: "grid gap-1 flex-1", children: [
                                          _jsx(Label, { className: "text-[10px] text-slate-400", children: "Tarea" }),
                                          _jsx(Input, {
                                            value: t.title, onChange: (e) => {
                                              const copy = [...newTasks]; copy[idx].title = e.target.value; setNewTasks(copy);
                                            }
                                          })]
                                      }
                                      ),
                                      _jsxs("div", {
                                        className: "grid gap-1 w-28", children: [
                                          _jsx(Label, { className: "text-[10px] text-slate-400", children: "Prioridad" }),
                                          _jsxs(Select, {
                                            value: t.priority, onValueChange: (v) => {
                                              const copy = [...newTasks]; copy[idx].priority = v; setNewTasks(copy);
                                            }, children: [
                                              _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
                                              _jsxs(SelectContent, {
                                                children: [
                                                  _jsx(SelectItem, { value: "HIGH", children: "Alta" }),
                                                  _jsx(SelectItem, { value: "MEDIUM", children: "Media" }),
                                                  _jsx(SelectItem, { value: "LOW", children: "Baja" })]
                                              }
                                              )]
                                          }
                                          )]
                                      }
                                      ),
                                      _jsxs("div", {
                                        className: "grid gap-1 w-28", children: [
                                          _jsx(Label, { className: "text-[10px] text-slate-400", children: "Hora" }),
                                          _jsx(Input, {
                                            type: "time", value: t.deadline, onChange: (e) => {
                                              const copy = [...newTasks]; copy[idx].deadline = e.target.value; setNewTasks(copy);
                                            }
                                          })]
                                      }
                                      ),
                                      newTasks.length > 1 &&
                                      _jsx("div", {
                                        className: "pt-6", children:
                                          _jsx(Button, {
                                            size: "icon", variant: "ghost", className: "text-red-500", onClick: () => {
                                              const copy = [...newTasks]; copy.splice(idx, 1); setNewTasks(copy);
                                            }, children: _jsx(Trash2, { className: "w-4 h-4" })
                                          })
                                      }
                                      )]
                                  }, idx

                                  )
                                ),
                                _jsxs(Button, {
                                  variant: "outline", className: "w-full border-dashed", onClick: () => setNewTasks([...newTasks, { title: "", priority: "MEDIUM", deadline: "" }]), children: [
                                    _jsx(Plus, { className: "w-4 h-4 mr-2" }), " Agregar L\xEDnea"]
                                }
                                )]
                            }
                            )]
                        }
                        ),
                        _jsx(DialogFooter, {
                          children:
                            _jsx(Button, { onClick: handleSave, className: "bg-emerald-500 hover:bg-emerald-600 text-white", children: "Guardar" })
                        }
                        )]
                    }
                    )]
                }
                ),


                _jsx(Dialog, {
                  open: isReportOpen, onOpenChange: setIsReportOpen, children:
                    _jsxs(DialogContent, {
                      children: [
                        _jsxs(DialogHeader, {
                          children: [
                            _jsx(DialogTitle, { children: "Enviar Reporte Semanal" }),
                            _jsx(DialogDescription, { children: "Genera y env\xEDa el reporte de rendimiento de la semana pasada (Lunes-Domingo) en formato PDF." }

                            )]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-3 py-4", children: [
                            _jsx(Label, { children: "Enviar a:" }),
                            _jsx(Input, {
                              value: reportEmails,
                              onChange: (e) => setReportEmails(e.target.value),
                              placeholder: "ejemplo@correo.com, jefe@enlace.org"
                            }
                            ),
                            _jsx("p", { className: "text-xs text-slate-400", children: "Separa m\xFAltiples correos con comas." })]
                        }
                        ),
                        _jsx(DialogFooter, {
                          children:
                            _jsx(Button, {
                              onClick: handleSendReport,
                              disabled: sendingReport,
                              className: "bg-[#FF0C60] hover:bg-[#D90A50] text-white", children:

                                sendingReport ? 'Enviando...' : 'Enviar Reporte'
                            }
                            )
                        }
                        )]
                    }
                    )
                }
                )]
            }
            ),

            _jsx(ScrollArea, {
              className: "flex-1", children:
                _jsx("div", {
                  className: "grid gap-3 pb-20", children:
                    sortedTasks.map((task) =>
                      _jsxs("div", {

                        className: "flex items-center justify-between p-4 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm", children: [

                          _jsxs("div", {
                            className: "flex items-center gap-4", children: [
                              _jsx("div", {
                                className: `p-3 rounded-xl text-slate-400 ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                  task.status === 'INCOMPLETE' ? 'bg-amber-100 text-amber-600' :
                                    'bg-slate-50 dark:bg-white/5'}`, children:

                                  _jsx(ListTodo, { className: "w-5 h-5" })
                              }
                              ),
                              _jsxs("div", {
                                children: [
                                  _jsx("h4", {
                                    className: `font-semibold ${task.status === 'COMPLETED' ? 'text-emerald-700 line-through' :
                                      task.status === 'INCOMPLETE' ? 'text-amber-700 line-through' :
                                        'text-slate-900 dark:text-white'}`, children:

                                      task.title
                                  }
                                  ),
                                  _jsxs("div", {
                                    className: "flex items-center gap-2 mt-1", children: [
                                      _jsx(Badge, {
                                        variant: "outline", className: getPriorityColor(task.priority), children:
                                          task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'
                                      }
                                      ),
                                      task.reminderSent &&
                                      _jsx(Badge, { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 text-[10px] h-5 px-2", children: "Recordatorio enviado" }

                                      ),

                                      task.deadline &&
                                      _jsxs(Badge, {
                                        variant: "secondary", className: "bg-slate-100 dark:bg-white/5 text-slate-500", children: [
                                          _jsx(Clock, { className: "w-3 h-3 mr-1" }), " ", task.deadline]
                                      }
                                      ),

                                      _jsx("div", {
                                        className: "text-xs text-slate-400 flex items-center gap-1 ml-2", children:
                                          _jsx("span", {
                                            className: "font-bold text-slate-600 dark:text-slate-300", children:
                                              (() => {
                                                const d = parseISO(task.scheduledDate);
                                                return isValid(d) ? format(d, "EEEE d", { locale: es }) : "Fecha Inválida";
                                              })()
                                          }
                                          )
                                      }
                                      )]
                                  }
                                  )]
                              }
                              )]
                          }
                          ),
                          _jsxs("div", {
                            className: "flex items-center gap-1", children: [
                              _jsx(Button, {
                                size: "icon", variant: "ghost", className: "text-slate-300 hover:text-red-500 hover:bg-red-500/10", onClick: () => setTaskToDelete(task.id), children:
                                  _jsx(Trash2, { className: "w-5 h-5" })
                              }
                              ),


                              (task.status === 'INCOMPLETE' || task.status === 'COMPLETED') && task.comment &&
                              _jsx(Button, {
                                size: "icon", variant: "ghost", className: "text-slate-300 hover:text-blue-500", onClick: () => setViewComment({ title: task.title, comment: task.comment }), children:
                                  _jsx(MessageSquare, { className: "w-5 h-5" })
                              }
                              )]
                          }

                          )]
                      }, task.id
                      )
                    )
                }
                )
            }
            )]
        }
        )]
    }
    ));

}