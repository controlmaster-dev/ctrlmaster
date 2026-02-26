"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Settings, Shield, Crown, Search, Archive, Wrench, MapPin, CalendarDays, KeyRound, Copy, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoginMap } from "@/components/LoginMap";
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget";
import { SpecialEventsManager } from "@/components/SpecialEventsManager"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
























export default function ConfigurationPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const getInitialWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));

    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const d = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${d}`;
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(getInitialWeekStart());
  const [scheduleMode, setScheduleMode] = useState('weekly');

  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', action: () => { }, type: 'danger'
  });

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: [], birthday: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [securityCodes, setSecurityCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (!savedUser) { router.push("/login"); return; }
    const user = JSON.parse(savedUser);

    const allowedEmails = ['knunez@enlace.org', 'rjimenez@enlace.org'];
    const allowedUsernames = ['knunez', 'rjimenez'];


    const email = user?.email || "";
    const username = user?.username || "";

    if (!allowedEmails.includes(email) && !allowedUsernames.includes(username)) {
      router.push("/");
      return;
    }

    setIsAdmin(true);
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchCodes();

      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentWeekStart]);

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/auth/registration-codes');
      const data = await res.json();
      if (Array.isArray(data)) setSecurityCodes(data);
    } catch (e) { console.error('Error fetching codes', e); }
  };

  const generateCode = async () => {
    setCodesLoading(true);
    try {
      const savedUser = localStorage.getItem('enlace-user');
      if (!savedUser) return;
      const user = JSON.parse(savedUser);
      const res = await fetch('/api/auth/registration-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdById: user.id })
      });
      if (!res.ok) throw new Error('Error generando código');
      await fetchCodes();
    } catch (e) { console.error('Error generating code', e); } finally { setCodesLoading(false); }
  };

  const deleteCode = async (id) => {
    try {
      await fetch(`/api/auth/registration-codes?id=${id}`, { method: 'DELETE' });
      await fetchCodes();
    } catch (e) { console.error('Error deleting code', e); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setModal({
      isOpen: false, title: '', message: '', action: () => { }, type: 'danger'
    });
    // Use a simple toast-like feedback
    const el = document.getElementById(`code-${code}`);
    if (el) { el.textContent = '¡Copiado!'; setTimeout(() => { el.textContent = code; }, 1500); }
  };

  const fetchData = async () => {
    try {

      const [usersRes, reportsRes] = await Promise.all([
        fetch(`/api/users?weekStart=${currentWeekStart}`),
        fetch('/api/reports')]
      );
      const usersData = await usersRes.json();
      const reportsData = await reportsRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(reportsData)) setReports(reportsData);
    } catch (e) { console.error("Error fetching data", e); } finally { setLoading(false); }
  };

  const handleEditUser = (user: { id: string; name: string; email: string; role: string; schedule?: unknown; tempSchedule?: unknown; shifts?: unknown[]; defaultShifts?: unknown[]; birthday?: string }) => {
    setIsEditing(true);
    setEditId(user.id);
    console.log("User for edit:", user, "Default Shifts:", user.defaultShifts);

    let schedule = [];
    try {



      if (user.defaultShifts && Array.isArray(user.defaultShifts) && user.defaultShifts.length > 0) {
        schedule = user.defaultShifts;
      } else if (user.shifts && Array.isArray(user.shifts) && user.shifts.length > 0) {

        schedule = JSON.parse(JSON.stringify(user.shifts));
      } else {
        schedule = typeof user.schedule === 'string' ? JSON.parse(user.schedule) : user.schedule || [];
      }
    } catch (e) { }

    setNewUser({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role || 'OPERATOR',
      schedule,
      birthday: user.birthday || ''
    });



    setIsUserModalOpen(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setNewUser({ name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: [], birthday: '' });
    setIsUserModalOpen(false);
  };

  const handleSaveUser = async () => {
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const body: { id?: string; name: string; email: string; role: string; password?: string; schedule: unknown; birthday: string } = { ...newUser };

      if (isEditing) {
        body.id = editId;
        if (!body.password) delete body.password;
      }

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Error guardando usuario");

      await fetchData();
      cancelEdit();
      setModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      setError("No se pudo guardar los cambios");

    }
  };

  const confirmSaveUser = (e) => {
    e.preventDefault();
    setModal({
      isOpen: true,
      title: isEditing ? 'Actualizar Usuario' : 'Crear Usuario',
      message: isEditing ?
        `¿Guardar cambios para "${newUser.name}"?` :
        `¿Crear al usuario "${newUser.name}"?`,
      type: 'warning',
      action: handleSaveUser
    });
  };

  const confirmDeleteUser = (id) => {
    setModal({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      type: 'danger',
      action: async () => {
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        await fetchData();
        setModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmDeleteReport = (id) => {
    setModal({
      isOpen: true,
      title: 'Eliminar Reporte',
      message: '¿Estás seguro de eliminar este reporte permanentemente?',
      type: 'danger',
      action: async () => {
        await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
        await fetchData();
        setModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (!isAdmin && loading) return _jsx("div", { className: "min-h-screen bg-background flex items-center justify-center text-foreground", children: "Verificando..." });
  if (!isAdmin) return null;

  const handleScheduleUpdate = async (userId, newShifts, weekStart) => {
    try {
      const body: { id: string; schedule?: unknown; tempSchedule?: unknown; weekStart?: string } = { id: userId };

      if (scheduleMode === 'default') {

        body.schedule = newShifts;
      } else {

        body.tempSchedule = newShifts;
        body.weekStart = weekStart;
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Error actualizando horario");

      await fetchData();
    } catch (err) {
      console.error("Failed to save schedule", err);
    }
  };

  const renderUserGrid = (title, roleFilter, icon) => {
    const filteredUsers = users.filter((u) => roleFilter(u.role));
    if (filteredUsers.length === 0) return null;

    return (
      _jsxs("div", {
        className: "space-y-4", children: [
          _jsxs("div", {
            className: "flex items-center gap-2 px-1", children: [
              _jsx("div", {
                className: "w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center", children:
                  icon
              }
              ),
              _jsx("h3", { className: "text-[10px] font-bold text-muted-foreground tracking-tight", children: title })]
          }
          ),

          _jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children:
              filteredUsers.map((u) =>
                _jsxs("div", {
                  className: "group relative bg-card/40 hover:bg-card/60 backdrop-blur-md border border-border hover:border-[#FF0C60]/30 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(255,12,96,0.2)]", children: [
                    _jsxs("div", {
                      className: "p-5 flex flex-col gap-4", children: [
                        _jsxs("div", {
                          className: "flex justify-between items-start", children: [
                            _jsxs("div", {
                              className: "flex items-center gap-3", children: [
                                _jsxs("div", {
                                  className: "relative", children: [
                                    _jsxs(Avatar, {
                                      className: "w-12 h-12 border border-border rounded-lg shadow-sm", children: [
                                        _jsx(AvatarImage, { src: u.image, className: "rounded-lg object-cover" }),
                                        _jsx(AvatarFallback, { className: "bg-muted text-muted-foreground font-bold text-sm rounded-lg", children: u.name.substring(0, 2).toUpperCase() })]
                                    }
                                    ),
                                    _jsx("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background", style: { backgroundColor: u.lastLogin ? '#10b981' : '#6b7280' } })]
                                }
                                ),
                                _jsxs("div", {
                                  children: [
                                    _jsx("h4", { className: "text-sm font-bold text-foreground tracking-tight leading-none", children: u.name }),
                                    _jsxs("span", { className: "text-[10px] text-muted-foreground font-mono font-medium opacity-60", children: ["#", u.id.slice(0, 8)] })]
                                }
                                )]
                            }
                            ),

                            u.role === 'BOSS' ?
                              _jsxs("div", { className: "inline-flex items-center px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold tracking-tight uppercase", children: [_jsx(Crown, { className: "w-3 h-3 mr-1" }), " Coord"] }) :
                              u.role === 'ENGINEER' ?
                                _jsxs("div", { className: "inline-flex items-center px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] font-bold tracking-tight uppercase", children: [_jsx(Wrench, { className: "w-3 h-3 mr-1" }), " Ing"] }) :
                                _jsx("div", { className: "inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border text-[9px] font-bold tracking-tight uppercase", children: "Operador" })]
                        }

                        ),

                        _jsxs("div", {
                          className: "space-y-3", children: [
                            _jsxs("div", {
                              className: "bg-background/50 rounded-lg p-3 border border-border/50", children: [
                                _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70", children: "Contacto" }),
                                _jsx("p", { className: "text-xs text-foreground font-medium truncate", children: u.email })]
                            }
                            ),

                            _jsxs("div", {
                              className: "grid grid-cols-2 gap-2", children: [
                                _jsxs("div", {
                                  className: "bg-background/50 rounded-lg p-3 border border-border/50", children: [
                                    _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70", children: "\xDAltima Vez" }),
                                    _jsx("p", {
                                      className: "text-xs text-foreground font-medium", children:
                                        u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Desconectado'
                                    }
                                    )]
                                }
                                ),
                                _jsxs("div", {
                                  className: "bg-background/50 rounded-lg p-3 border border-border/50", children: [
                                    _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70", children: "Ubicaci\xF3n" }),
                                    _jsxs("div", {
                                      className: "flex items-center gap-1.5 opacity-80", children: [
                                        _jsx(MapPin, { className: "w-3.5 h-3.5 text-muted-foreground" }),
                                        _jsx("span", { className: "text-xs font-medium text-foreground truncate", children: u.lastLoginCountry || 'N/A' })]
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

                    _jsxs("div", {
                      className: "px-5 py-3 border-t border-border/50 bg-muted/20 flex justify-between items-center", children: [
                        _jsxs(Dialog, {
                          children: [
                            _jsx(DialogTrigger, {
                              asChild: true, children:
                                _jsxs(Button, {
                                  variant: "ghost", size: "sm", className: "h-8 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground", children: [
                                    _jsx(Search, { className: "w-3.5 h-3.5 mr-1.5" }), " Detalles"]
                                }
                                )
                            }
                            ),
                            _jsxs(DialogContent, {
                              className: "bg-card border-border text-foreground max-w-md p-0 overflow-hidden shadow-2xl rounded-xl ring-1 ring-border", children: [
                                _jsx("div", {
                                  className: "bg-muted/30 border-b border-border p-8", children:
                                    _jsxs("div", {
                                      className: "flex items-center gap-6", children: [
                                        _jsxs(Avatar, {
                                          className: "w-20 h-20 border border-border rounded-xl shadow-sm", children: [
                                            _jsx(AvatarImage, { src: u.image, className: "rounded-xl object-cover" }),
                                            _jsx(AvatarFallback, { className: "bg-background text-muted-foreground text-2xl font-bold rounded-xl", children: u.name.substring(0, 2).toUpperCase() })]
                                        }
                                        ),
                                        _jsxs("div", {
                                          children: [
                                            _jsx("div", { className: "text-[#FF0C60] font-semibold text-[10px] uppercase tracking-widest mb-2", children: u.role }),
                                            _jsx("h3", { className: "text-3xl font-bold tracking-tighter text-foreground leading-none", children: u.name }),
                                            _jsx("p", { className: "text-muted-foreground text-xs font-medium mt-2 tracking-tight", children: u.email })]
                                        }
                                        )]
                                    }
                                    )
                                }
                                ),

                                _jsx("div", {
                                  className: "p-8 space-y-6", children:
                                    _jsxs("div", {
                                      className: "grid grid-cols-2 gap-8", children: [
                                        _jsxs("div", {
                                          className: "space-y-2", children: [
                                            _jsx("p", { className: "text-muted-foreground text-[10px] font-semibold uppercase tracking-widest opacity-70", children: "\xDAltimo acceso" }),
                                            _jsx("p", {
                                              className: "text-foreground font-semibold text-sm", children:
                                                u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-CR') : 'Nunca'
                                            }
                                            )]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "space-y-2", children: [
                                            _jsx("p", { className: "text-muted-foreground text-[10px] font-semibold uppercase tracking-widest opacity-70", children: "IP de conexi\xF3n" }),
                                            _jsx("p", { className: "text-foreground font-mono font-medium text-sm tracking-tighter", children: u.lastLoginIP || 'N/A' })]
                                        }
                                        )]
                                    }
                                    )
                                }
                                )]
                            }
                            )]
                        }
                        ),

                        _jsxs("div", {
                          className: "flex gap-1.5", children: [
                            _jsx(Button, {
                              variant: "ghost", size: "icon", onClick: () => handleEditUser(u), className: "h-8 w-8 rounded-md text-muted-foreground hover:text-[#FF0C60] hover:bg-[#FF0C60]/10 transition-colors", children:
                                _jsx(Settings, { className: "w-3.5 h-3.5" })
                            }
                            ),
                            u.role !== 'BOSS' &&
                            _jsx(Button, {
                              variant: "ghost", size: "icon", onClick: () => confirmDeleteUser(u.id), className: "h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors", children:
                                _jsx(Trash2, { className: "w-3.5 h-3.5" })
                            }
                            )]
                        }

                        )]
                    }
                    )]
                }, u.id
                )
              )
          }
          )]
      }
      ));

  };

  return (
    _jsx("div", {
      className: "min-h-screen relative overflow-hidden text-foreground selection:bg-[#FF0C60] selection:text-white pb-20", children:



        _jsxs("div", {
          className: "relative z-10 text-foreground", children: [
            _jsx(ConfirmModal, { isOpen: modal.isOpen, title: modal.title, message: modal.message, onConfirm: modal.action, onCancel: () => setModal({ ...modal, isOpen: false }), type: modal.type }),


            _jsx(Dialog, {
              open: isUserModalOpen, onOpenChange: setIsUserModalOpen, children:
                _jsx(DialogContent, {
                  className: "max-w-2xl bg-card border-border text-foreground p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(255,12,96,0.15)] ring-1 ring-border rounded-xl", children:
                    _jsxs("div", {
                      className: "relative", children: [

                        _jsx("div", { className: "absolute inset-0 h-32 bg-gradient-to-br from-[#FF0C60]/10 via-transparent to-transparent pointer-events-none" }),

                        _jsxs("div", {
                          className: "relative bg-muted/30 border-b border-border p-8 flex items-center gap-6", children: [
                            _jsx("div", {
                              className: "w-14 h-14 bg-gradient-to-br from-[#FF0C60] to-[#FF0C60]/80 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,12,96,0.3)] ring-1 ring-white/20", children:
                                isEditing ? _jsx(Settings, { className: "w-7 h-7 text-white" }) : _jsx(UserPlus, { className: "w-7 h-7 text-white" })
                            }
                            ),
                            _jsxs("div", {
                              children: [
                                _jsx(DialogTitle, {
                                  className: "text-2xl font-semibold tracking-tight text-foreground mb-1", children:
                                    isEditing ? 'Editar Perfil y Horario' : 'Registrar Nuevo Operador'
                                }
                                ),
                                _jsxs(DialogDescription, {
                                  className: "text-[10px] font-semibold text-[#FF0C60] uppercase tracking-[0.2em] flex items-center gap-2", children: [
                                    _jsx("div", { className: "w-1 h-1 bg-[#FF0C60] rounded-full animate-pulse" }), "Gesti\xF3n de credenciales y turnos fijos"]
                                }

                                )]
                            }
                            )]
                        }
                        ),

                        _jsx("div", {
                          className: "p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8", children:
                            _jsxs("form", {
                              id: "user-form", onSubmit: confirmSaveUser, className: "space-y-10", children: [
                                error &&
                                _jsxs(motion.div, {
                                  initial: { opacity: 0, y: -10 },
                                  animate: { opacity: 1, y: 0 },
                                  className: "p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-500 font-bold tracking-tight flex items-center gap-3", children: [

                                    _jsx("div", { className: "w-1.5 h-1.5 bg-rose-500 rounded-full" }),
                                    error]
                                }
                                ),



                                _jsxs("div", {
                                  className: "space-y-6", children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-2", children: [
                                        _jsx("div", { className: "w-1.5 h-4 bg-[#FF0C60] rounded-full" }),
                                        _jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Datos Personales" })]
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "grid grid-cols-2 gap-6", children: [
                                        _jsxs("div", {
                                          className: "space-y-2.5", children: [
                                            _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1", children: "NOMBRE COMPLETO" }),
                                            _jsx("div", {
                                              className: "relative group", children:
                                                _jsx(Input, {
                                                  value: newUser.name, onChange: (e) => setNewUser({ ...newUser, name: e.target.value }),
                                                  className: "bg-background border-input text-foreground focus:border-[#FF0C60]/50 placeholder:text-muted-foreground h-12 text-sm font-medium uppercase rounded-lg transition-all ring-offset-background focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30",
                                                  required: true, placeholder: "EJ. JUAN P\xC9REZ"
                                                }
                                                )
                                            }
                                            )]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "space-y-2.5", children: [
                                            _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1", children: "CORREO CORPORATIVO" }),
                                            _jsx(Input, {
                                              type: "email", value: newUser.email, onChange: (e) => setNewUser({ ...newUser, email: e.target.value }),
                                              className: "bg-background border-input text-foreground focus:border-[#FF0C60]/50 placeholder:text-muted-foreground h-12 text-sm font-medium rounded-lg transition-all ring-offset-background focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30",
                                              required: true, placeholder: "usuario@enlace.org"
                                            }
                                            )]
                                        }
                                        )]
                                    }
                                    )]
                                }
                                ),


                                _jsxs("div", {
                                  className: "space-y-6", children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-2", children: [
                                        _jsx("div", { className: "w-1.5 h-4 bg-[#FF0C60] rounded-full" }),
                                        _jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Seguridad y Rango" })]
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "grid grid-cols-2 gap-6", children: [
                                        _jsxs("div", {
                                          className: "space-y-2.5", children: [
                                            _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1", children: "CARGO DESIGNADO" }),
                                            _jsxs(Select, {
                                              value: newUser.role, onValueChange: (val) => setNewUser({ ...newUser, role: val }), children: [
                                                _jsx(SelectTrigger, {
                                                  className: "bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg uppercase ring-offset-background focus:ring-1 focus:ring-[#FF0C60]/30", children:
                                                    _jsx(SelectValue, { placeholder: "Seleccionar rol" })
                                                }
                                                ),
                                                _jsxs(SelectContent, {
                                                  className: "bg-popover border-border text-popover-foreground", children: [
                                                    _jsx(SelectItem, { value: "OPERATOR", className: "focus:bg-[#FF0C60] focus:text-white hover:bg-muted", children: "Operador" }),
                                                    _jsx(SelectItem, { value: "ENGINEER", className: "focus:bg-[#FF0C60] focus:text-white hover:bg-muted", children: "Ingeniero" }),
                                                    _jsx(SelectItem, { value: "BOSS", className: "focus:bg-[#FF0C60] focus:text-white hover:bg-muted", children: "Coordinador" })]
                                                }
                                                )]
                                            }
                                            )]
                                        }
                                        ),
                                        _jsxs("div", {
                                          className: "space-y-2.5", children: [
                                            _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1", children: "CONTRASE\xD1A DE ACCESO" }),
                                            _jsx(Input, {
                                              value: newUser.password, onChange: (e) => setNewUser({ ...newUser, password: e.target.value }),
                                              className: "bg-background border-input text-foreground focus:border-[#FF0C60]/50 placeholder:text-muted-foreground h-12 text-sm font-medium rounded-lg transition-all ring-offset-background focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30 font-mono",
                                              required: !isEditing,
                                              type: "password",
                                              placeholder: isEditing ? "SIN CAMBIOS" : "••••••••"
                                            }
                                            )]
                                        }
                                        )]
                                    }
                                    )]
                                }
                                ),


                                _jsxs("div", {
                                  className: "space-y-6", children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-2", children: [
                                        _jsx("div", { className: "w-1.5 h-4 bg-[#FF0C60] rounded-full" }),
                                        _jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Celebraciones" })]
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "space-y-2.5", children: [
                                        _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1", children: "FECHA DE CUMPLEA\xD1OS" }),
                                        _jsxs("div", {
                                          className: "flex gap-4", children: [
                                            _jsxs(Select, {
                                              value: newUser.birthday ? newUser.birthday.split('-')[0] : undefined,
                                              onValueChange: (m) => {
                                                const parts = newUser.birthday.split('-');
                                                const d = parts[1] || '01';
                                                setNewUser({ ...newUser, birthday: `${m}-${d}` });
                                              }, children: [

                                                _jsx(SelectTrigger, {
                                                  className: "bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg flex-1 ring-offset-background focus:ring-1 focus:ring-[#FF0C60]/30", children:
                                                    _jsx(SelectValue, { placeholder: "MES" })
                                                }
                                                ),
                                                _jsx(SelectContent, {
                                                  className: "bg-popover border-border text-popover-foreground max-h-60", children:
                                                    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) =>
                                                      _jsx(SelectItem, {
                                                        value: m, className: "focus:bg-[#FF0C60] hover:bg-muted", children:
                                                          new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-CR', { month: 'long' }).toUpperCase()
                                                      }, m
                                                      )
                                                    )
                                                }
                                                )]
                                            }
                                            ),

                                            _jsxs(Select, {
                                              value: newUser.birthday ? newUser.birthday.split('-')[1] : undefined,
                                              onValueChange: (d) => {
                                                const parts = newUser.birthday.split('-');
                                                const m = parts[0] || '01';
                                                setNewUser({ ...newUser, birthday: `${m}-${d}` });
                                              }, children: [

                                                _jsx(SelectTrigger, {
                                                  className: "bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg w-32 ring-offset-background focus:ring-1 focus:ring-[#FF0C60]/30", children:
                                                    _jsx(SelectValue, { placeholder: "D\xCDA" })
                                                }
                                                ),
                                                _jsx(SelectContent, {
                                                  className: "bg-popover border-border text-popover-foreground max-h-60", children:
                                                    Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) =>
                                                      _jsx(SelectItem, { value: d, className: "focus:bg-[#FF0C60] hover:bg-muted", children: d }, d)
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


                                _jsxs("div", {
                                  className: "pt-8 border-t border-white/5", children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-6", children: [
                                        _jsx("div", { className: "w-1.5 h-4 bg-[#FF0C60] rounded-full" }),
                                        _jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Planificaci\xF3n de Turnos" })]
                                    }
                                    ),
                                    _jsx(ScheduleEditor, {
                                      value: newUser.schedule,
                                      onChange: (s) => setNewUser({ ...newUser, schedule: s })
                                    }
                                    )]
                                }
                                )]
                            }
                            )
                        }
                        ),

                        _jsxs("div", {
                          className: "p-8 border-t border-border bg-muted/10 flex justify-end gap-4", children: [
                            _jsx(Button, {
                              type: "button",
                              variant: "ghost",
                              onClick: cancelEdit,
                              className: "h-12 px-6 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all", children:
                                "CANCELAR"
                            }

                            ),
                            _jsx("button", {
                              form: "user-form",
                              type: "submit",
                              className: "px-8 h-12 bg-[#FF0C60] hover:bg-[#FF0C60]/90 text-white font-semibold text-[11px] uppercase tracking-[0.15em] rounded-lg transition-all shadow-[0_8px_20px_-6px_rgba(255,12,96,0.4)] active:scale-95", children:

                                isEditing ? 'GUARDAR CAMBIOS' : 'CONFIRMAR REGISTRO'
                            }
                            )]
                        }
                        )]
                    }
                    )
                }
                )
            }
            ),

            _jsxs("div", {
              className: "max-w-[1600px] mx-auto p-4 md:p-10 pt-20 md:pt-32 space-y-8", children: [
                _jsxs("div", {
                  className: "flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6", children: [
                    _jsxs("div", {
                      children: [
                        _jsxs("h1", {
                          className: "text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-2", children: [
                            _jsx(Settings, { className: "w-8 h-8 text-[#FF0C60]" }), " Configuraci\xF3n"]
                        }
                        ),
                        _jsx("p", { className: "text-muted-foreground mt-1 text-base md:text-lg font-medium", children: "Administraci\xF3n de usuarios y limpieza de base de datos." })]
                    }
                    ),

                    _jsxs("div", {
                      className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto", children: [
                        _jsxs(Button, {
                          onClick: () => { cancelEdit(); setIsUserModalOpen(true); }, className: "bg-[#FF0C60] hover:bg-[#FF0C60]/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF0C60]/20 h-11 sm:w-auto w-full", children: [
                            _jsx(UserPlus, { className: "w-4 h-4 mr-2" }), " Nuevo Operador"]
                        }
                        ),

                        _jsxs("div", {
                          className: "flex bg-muted/20 p-1.5 rounded-lg border border-border w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth snap-x", children: [
                            _jsxs("button", {
                              onClick: () => setActiveTab('users'), className: `px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${activeTab === 'users' ? 'bg-[#FF0C60]/10 text-[#FF0C60] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: [
                                _jsx(Shield, { className: "w-4 h-4" }), " Usuarios"]
                            }
                            ),
                            _jsxs("button", {
                              onClick: () => setActiveTab('schedule'), className: `px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${activeTab === 'schedule' ? 'bg-[#FF0C60]/10 text-[#FF0C60] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: [
                                _jsx(CalendarIcon, { className: "w-4 h-4" }), " Horarios"]
                            }
                            ),
                            _jsxs("button", {
                              onClick: () => setActiveTab('events'), className: `px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${activeTab === 'events' ? 'bg-[#FF0C60]/10 text-[#FF0C60] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: [
                                _jsx(CalendarDays, { className: "w-4 h-4" }), " Eventos"]
                            }
                            ),
                            _jsxs("button", {
                              onClick: () => setActiveTab('security'), className: `px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${activeTab === 'security' ? 'bg-[#FF0C60]/10 text-[#FF0C60] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: [
                                _jsx(KeyRound, { className: "w-4 h-4" }), " Seguridad"]
                            }
                            ),
                            _jsxs("button", {
                              onClick: () => setActiveTab('reports'), className: `px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${activeTab === 'reports' ? 'bg-[#FF0C60]/10 text-[#FF0C60] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, children: [
                                _jsx(Archive, { className: "w-4 h-4" }), " Reportes"]
                            }
                            )]
                        }
                        )]
                    }
                    )]
                }
                ),
                _jsx(AnimatePresence, {
                  mode: "wait", children:
                    activeTab === 'users' ?
                      _jsxs(motion.div, {

                        initial: { opacity: 0, scale: 0.98, y: 10 },
                        animate: { opacity: 1, scale: 1, y: 0 },
                        exit: { opacity: 0, scale: 0.98, y: 10 },
                        transition: { duration: 0.3, ease: "easeOut" },
                        className: "space-y-6", children: [

                          _jsxs("div", {
                            className: "space-y-8", children: [
                              _jsxs("div", {
                                className: "flex flex-col gap-6", children: [
                                  _jsx(LoginMap, { users: users }),
                                  _jsx(ActiveUsersWidget, { users: users })]
                              }
                              ),


                              _jsx("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children:
                                  [
                                    { label: 'Equipo Total', value: users.length, icon: Shield, color: 'text-blue-500' },
                                    { label: 'Coordinadores', value: users.filter((u) => u.role === 'BOSS').length, icon: Crown, color: 'text-amber-500' },
                                    { label: 'Ingenieros', value: users.filter((u) => u.role === 'ENGINEER').length, icon: Wrench, color: 'text-purple-500' },
                                    { label: 'Operadores', value: users.filter((u) => !['BOSS', 'ENGINEER'].includes(u.role || '')).length, icon: Shield, color: 'text-emerald-500' }].
                                    map((stat, i) =>
                                      _jsxs(Card, {
                                        className: "bg-card/40 backdrop-blur-md border-border shadow-none rounded-md ring-1 ring-border p-5 flex items-center justify-between group hover:border-[#FF0C60]/30 transition-all duration-300", children: [
                                          _jsxs("div", {
                                            children: [
                                              _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground tracking-widest uppercase opacity-60", children: stat.label }),
                                              _jsx("p", { className: "text-3xl font-bold text-foreground mt-1 tracking-tighter", children: stat.value })]
                                          }
                                          ),
                                          _jsx("div", {
                                            className: `w-12 h-12 bg-muted/30 border border-border rounded-md flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`, children:
                                              _jsx(stat.icon, { className: "w-6 h-6" })
                                          }
                                          )]
                                      }, i
                                      )
                                    )
                              }
                              )]
                          }
                          ),


                          _jsxs(Card, {
                            className: "bg-card/20 backdrop-blur-md border border-border shadow-none rounded-md ring-1 ring-border overflow-hidden", children: [
                              _jsx(CardHeader, {
                                className: "bg-muted/30 border-b border-border py-4 px-8", children:
                                  _jsxs("div", {
                                    className: "flex items-center gap-3", children: [
                                      _jsx("div", {
                                        className: "w-10 h-10 bg-muted/30 text-muted-foreground rounded-md flex items-center justify-center border border-border shadow-inner", children:
                                          _jsx(Search, { className: "w-5 h-5 opacity-50" })
                                      }
                                      ),
                                      _jsx("h3", { className: "text-[11px] font-semibold tracking-tight text-muted-foreground", children: "Explorador de Personal" })]
                                  }
                                  )
                              }
                              ),
                              _jsx("div", {
                                className: "p-8", children:
                                  _jsxs("div", {
                                    className: "space-y-16", children: [
                                      renderUserGrid("Coordinadores", (role) => role === 'BOSS', _jsx(Crown, { className: "w-5 h-5 text-amber-500" })),
                                      renderUserGrid("Ingenieros", (role) => role === 'ENGINEER', _jsx(Wrench, { className: "w-5 h-5 text-purple-500" })),
                                      renderUserGrid("Operadores", (role) => !['BOSS', 'ENGINEER'].includes(role || ''), _jsx(Shield, { className: "w-5 h-5 text-blue-500" }))]
                                  }
                                  )
                              }
                              )]
                          }
                          )]
                      }, "users"
                      ) :
                      activeTab === 'schedule' ?
                        _jsx(motion.div, {

                          initial: { opacity: 0, x: 20 },
                          animate: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: -20 },
                          transition: { duration: 0.2 }, children:

                            _jsxs(Card, {
                              className: "bg-card/40 backdrop-blur-md border border-border shadow-none rounded-md overflow-hidden h-fit ring-1 ring-border flex flex-col", children: [
                                _jsxs("div", {
                                  className: "p-4 border-b border-border bg-muted/10 flex justify-between items-center", children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2", children: [
                                        _jsx(CalendarIcon, { className: "w-5 h-5 text-muted-foreground" }),
                                        _jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Gesti\xF3n de Horarios" })]
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border", children: [
                                        _jsx("button", {
                                          onClick: () => setScheduleMode('weekly'),
                                          className: `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scheduleMode === 'weekly' ? 'bg-[#FF0C60] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`, children:
                                            "Esta Semana (Temp)"
                                        }

                                        ),
                                        _jsx("button", {
                                          onClick: () => setScheduleMode('default'),
                                          className: `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scheduleMode === 'default' ? 'bg-[#FF0C60] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`, children:
                                            "Fijo (Predeterminado)"
                                        }

                                        )]
                                    }
                                    )]
                                }
                                ),
                                _jsxs("div", {
                                  className: "relative", children: [

                                    scheduleMode === 'default' &&
                                    _jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-[#FF0C60] z-20 animate-pulse" }),


                                    _jsx(WeeklyCalendar, {
                                      operators: users.map((u) => ({
                                        id: u.id,
                                        name: u.name,
                                        image: u.image,





                                        shifts: (scheduleMode === 'default' ? u.defaultShifts : u.shifts) || [],
                                        isTempSchedule: scheduleMode === 'weekly' ? u.isTempSchedule : false
                                      })),
                                      currentWeekStart: currentWeekStart,
                                      onWeekChange: setCurrentWeekStart,
                                      onUpdateSchedule: handleScheduleUpdate
                                    }
                                    )]
                                }
                                )]
                            }
                            )
                        }, "schedule"
                        ) :
                        activeTab === 'events' ?
                          _jsx(motion.div, {

                            initial: { opacity: 0, x: 20 },
                            animate: { opacity: 1, x: 0 },
                            exit: { opacity: 0, x: -20 },
                            transition: { duration: 0.2 }, children:

                              _jsx(SpecialEventsManager, {})
                          }, "events"
                          ) :
                          activeTab === 'security' ?
                            _jsx(motion.div, {
                              initial: { opacity: 0, scale: 0.98, y: 10 },
                              animate: { opacity: 1, scale: 1, y: 0 },
                              exit: { opacity: 0, scale: 0.98, y: 10 },
                              transition: { duration: 0.3, ease: "easeOut" }, children:
                                _jsxs(Card, {
                                  className: "bg-card/40 backdrop-blur-md border border-border shadow-none rounded-md ring-1 ring-border", children: [
                                    _jsx(CardHeader, {
                                      className: "bg-muted/10 p-8 border-b border-border", children:
                                        _jsxs("div", {
                                          className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-6", children: [
                                            _jsxs("div", {
                                              className: "space-y-2", children: [
                                                _jsxs(CardTitle, {
                                                  className: "text-3xl font-bold text-foreground tracking-tighter leading-none flex items-center gap-3", children: [
                                                    _jsx(KeyRound, { className: "w-8 h-8 text-[#FF0C60]" }), "Códigos de Registro"]
                                                }),
                                                _jsx(CardDescription, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight mt-2 opacity-60", children: "Genere códigos de seguridad para autorizar nuevos operadores. Cada código expira en 24 horas y solo puede usarse una vez." })]
                                            }),
                                            _jsxs(Button, {
                                              onClick: generateCode, disabled: codesLoading,
                                              className: "bg-[#FF0C60] hover:bg-[#FF0C60]/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF0C60]/20 h-11", children: [
                                                codesLoading ? _jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : _jsx(KeyRound, { className: "w-4 h-4 mr-2" }),
                                                "Generar Código"]
                                            })]
                                        })
                                    }),
                                    _jsx(CardContent, {
                                      className: "p-8", children:
                                        securityCodes.length === 0 ?
                                          _jsxs("div", {
                                            className: "flex flex-col items-center justify-center py-16 text-center space-y-4", children: [
                                              _jsx("div", { className: "w-16 h-16 rounded-xl bg-muted/30 border border-border flex items-center justify-center", children: _jsx(KeyRound, { className: "w-8 h-8 text-muted-foreground opacity-40" }) }),
                                              _jsx("p", { className: "text-sm font-semibold text-muted-foreground", children: "No hay códigos generados" }),
                                              _jsx("p", { className: "text-xs text-muted-foreground opacity-60 max-w-sm", children: "Genere un código de seguridad y compártalo con el operador que desea registrarse." })]
                                          }) :
                                          _jsx("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children:
                                              securityCodes.map((c) =>
                                                _jsxs("div", {
                                                  className: `relative bg-card/60 border rounded-xl p-5 space-y-4 transition-all duration-300 ${c.status === 'available' ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-sm hover:shadow-emerald-500/5' :
                                                      c.status === 'used' ? 'border-border opacity-50' :
                                                        'border-amber-500/20 opacity-60'
                                                    }`, children: [
                                                      _jsxs("div", {
                                                        className: "flex items-center justify-between", children: [
                                                          _jsxs("div", {
                                                            className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${c.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                                c.status === 'used' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                              }`, children: [
                                                                c.status === 'available' ? _jsx(CheckCircle2, { className: "w-3 h-3" }) :
                                                                  c.status === 'used' ? _jsx(Shield, { className: "w-3 h-3" }) :
                                                                    _jsx(Clock, { className: "w-3 h-3" }),
                                                                c.status === 'available' ? 'Disponible' :
                                                                  c.status === 'used' ? 'Usado' : 'Expirado']
                                                          }),
                                                          c.status === 'available' &&
                                                          _jsx(Button, {
                                                            variant: "ghost", size: "icon",
                                                            onClick: () => deleteCode(c.id),
                                                            className: "h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md", children:
                                                              _jsx(Trash2, { className: "w-3.5 h-3.5" })
                                                          })]
                                                      }),
                                                      _jsxs("div", {
                                                        className: "space-y-2", children: [
                                                          _jsx("p", { id: `code-${c.code}`, className: "text-2xl font-mono font-bold tracking-[0.2em] text-foreground text-center py-2", children: c.code }),
                                                          c.status === 'available' &&
                                                          _jsxs(Button, {
                                                            variant: "outline", size: "sm",
                                                            onClick: () => copyCode(c.code),
                                                            className: "w-full h-9 text-[10px] font-bold uppercase tracking-wider border-border hover:border-[#FF0C60]/30 hover:text-[#FF0C60] hover:bg-[#FF0C60]/5", children: [
                                                              _jsx(Copy, { className: "w-3 h-3 mr-2" }), "Copiar Código"]
                                                          })]
                                                      }),
                                                      _jsxs("div", {
                                                        className: "flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50", children: [
                                                          _jsx("span", { children: new Date(c.createdAt).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }),
                                                          _jsxs("span", {
                                                            className: "flex items-center gap-1", children: [
                                                              _jsx(Clock, { className: "w-3 h-3" }),
                                                              "Exp: " + new Date(c.expiresAt).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })]
                                                          })]
                                                      })]
                                                }, c.id)
                                              )
                                          })
                                    })]
                                })
                            }, "security"
                            ) :

                            _jsx(motion.div, {

                              initial: { opacity: 0, scale: 0.98, y: 10 },
                              animate: { opacity: 1, scale: 1, y: 0 },
                              exit: { opacity: 0, scale: 0.98, y: 10 },
                              transition: { duration: 0.3, ease: "easeOut" }, children:

                                _jsxs(Card, {
                                  className: "bg-card/40 backdrop-blur-md border border-border shadow-none rounded-md ring-1 ring-border", children: [
                                    _jsx(CardHeader, {
                                      className: "bg-muted/10 p-8 border-b border-border", children:
                                        _jsxs("div", {
                                          className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-6", children: [
                                            _jsxs("div", {
                                              className: "space-y-2", children: [
                                                _jsx(CardTitle, { className: "text-3xl font-bold text-foreground tracking-tighter leading-none", children: "Gesti\xF3n de reportes" }),
                                                _jsx(CardDescription, { className: "text-muted-foreground font-semibold text-[10px] tracking-tight mt-2 opacity-60", children: "Filtro y depuraci\xF3n de la base de datos de incidencias." })]
                                            }
                                            ),
                                            _jsxs("div", {
                                              className: "relative w-full md:w-[300px]", children: [
                                                _jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF0C60]" }),
                                                _jsx(Input, { placeholder: "Buscar por ID o descripci\xF3n...", className: "pl-12 bg-muted/20 border-2 border-border w-full text-[10px] font-medium tracking-tight h-12 text-foreground focus:border-[#FF0C60] transition-colors rounded-md" })]
                                            }
                                            )]
                                        }
                                        )
                                    }
                                    ),
                                    _jsx(CardContent, {
                                      className: "p-0", children:
                                        _jsxs(Table, {
                                          children: [
                                            _jsx(TableHeader, {
                                              className: "bg-muted/30 border-b border-border", children:
                                                _jsxs(TableRow, {
                                                  className: "border-none hover:bg-transparent", children: [
                                                    _jsx(TableHead, { className: "pl-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground", children: "ID Interno" }),
                                                    _jsx(TableHead, { className: "h-12 text-[10px] font-semibold tracking-tight text-muted-foreground", children: "Marca de Tiempo" }),
                                                    _jsx(TableHead, { className: "h-12 text-[10px] font-semibold tracking-tight text-muted-foreground", children: "Operador" }),
                                                    _jsx(TableHead, { className: "h-12 text-[10px] font-semibold tracking-tight text-muted-foreground w-[40%]", children: "Descripci\xF3n del Suceso" }),
                                                    _jsx(TableHead, { className: "text-right pr-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground", children: "Acciones" })]
                                                }
                                                )
                                            }
                                            ),
                                            _jsx(TableBody, {
                                              className: "divide-y divide-border", children:
                                                reports.map((report) =>
                                                  _jsxs(TableRow, {
                                                    className: "border-none hover:bg-muted/20 transition-all duration-200 group", children: [
                                                      _jsxs(TableCell, { className: "pl-8 font-mono text-[10px] text-[#FF0C60] font-semibold tracking-tighter", children: ["#", report.id.slice(0, 8)] }),
                                                      _jsx(TableCell, { className: "text-foreground text-xs font-semibold tracking-tight", children: new Date(report.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) }),
                                                      _jsx(TableCell, { className: "text-foreground text-xs font-semibold tracking-tight", children: report.operatorName }),
                                                      _jsx(TableCell, { className: "text-muted-foreground text-xs font-medium max-w-md truncate", children: report.problemDescription }),
                                                      _jsx(TableCell, {
                                                        className: "text-right pr-8", children:
                                                          _jsx(Button, {
                                                            variant: "ghost", size: "icon", onClick: () => confirmDeleteReport(report.id), className: "h-9 w-9 text-rose-500 hover:text-white hover:bg-rose-500 transition-all rounded-md", children:
                                                              _jsx(Trash2, { className: "w-4 h-4 stroke-[3]" })
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
                                    )]
                                }
                                )
                            }, "reports"
                            )
                }

                )]
            }
            )]
        }
        )
    }
    ));

}