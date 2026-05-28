"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  UserPlus,
  Settings,
  Shield,
  Crown,
  Search,
  Wrench,
  MapPin,
  Calendar as CalendarIcon,
  KeyRound,
  Copy,
  Clock,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ConfirmModal } from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserFormDialog,
  type UserFormState,
} from "@/components/configuracion/UserFormDialog";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoginMap } from "@/components/LoginMap";
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget";
import { SpecialEventsManager } from "@/components/SpecialEventsManager";
import { ConfiguracionSkeleton } from "@/components/skeletons/ConfiguracionSkeleton";
import { useConfiguracionBundle } from "@/hooks/useConfiguracionBundle";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { pageContainerClass } from "@/lib/page-layout";
import { cn } from "@/lib/utils";

export default function ConfigurationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const [currentWeekStart, setCurrentWeekStart] = useState(getSundayWeekStart);
  const [scheduleMode, setScheduleMode] = useState("weekly");

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    type: "danger" as "danger" | "warning",
  });

  const [newUser, setNewUser] = useState<UserFormState>({
    name: "",
    email: "",
    password: "password123",
    role: "OPERATOR",
    schedule: [],
    birthday: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [codesLoading, setCodesLoading] = useState(false);

  const {
    users,
    reports,
    securityCodes,
    isReady,
    reportsReady,
    refresh,
  } = useConfiguracionBundle(currentWeekStart, isAdmin);

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(savedUser);

    if (!isConfigAdmin(user)) {
      router.push("/");
      return;
    }

    setIsAdmin(true);
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => void refresh(), 30000);
    return () => clearInterval(interval);
  }, [isAdmin, refresh]);

  const generateCode = async () => {
    setCodesLoading(true);
    try {
      const savedUser = localStorage.getItem("enlace-user");
      if (!savedUser) return;
      const user = JSON.parse(savedUser);
      const res = await fetch("/api/auth/registration-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdById: user.id }),
      });
      if (!res.ok) throw new Error("Error generando código");
      await refresh();
    } catch (e) {
      console.error("Error generating code", e);
    } finally {
      setCodesLoading(false);
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await fetch(`/api/auth/registration-codes?id=${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      console.error("Error deleting code", e);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    const el = document.getElementById(`code-${code}`);
    if (el) {
      el.textContent = "¡Copiado!";
      setTimeout(() => {
        el.textContent = code;
      }, 1500);
    }
  };

  const handleEditUser = (user: any) => {
    setIsEditing(true);
    setEditId(user.id);

    let schedule = [];
    try {
      if (
        user.defaultShifts &&
        Array.isArray(user.defaultShifts) &&
        user.defaultShifts.length > 0
      ) {
        schedule = user.defaultShifts;
      } else if (
        user.shifts &&
        Array.isArray(user.shifts) &&
        user.shifts.length > 0
      ) {
        schedule = JSON.parse(JSON.stringify(user.shifts));
      } else {
        schedule =
          typeof user.schedule === "string"
            ? JSON.parse(user.schedule)
            : user.schedule || [];
      }
    } catch (e) {}

    setNewUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role || "OPERATOR",
      schedule,
      birthday: user.birthday || "",
    });

    setIsUserModalOpen(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setNewUser({
      name: "",
      email: "",
      password: "password123",
      role: "OPERATOR",
      schedule: [],
      birthday: "",
    });
    setIsUserModalOpen(false);
  };

  const handleSaveUser = async () => {
    try {
      const method = isEditing ? "PATCH" : "POST";
      const body: any = { ...newUser };

      if (isEditing) {
        body.id = editId;
        if (!body.password) delete body.password;
      }

      const res = await fetch("/api/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error guardando usuario");

      await refresh();
      cancelEdit();
      setModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      setError("No se pudo guardar los cambios");
    }
  };

  const confirmSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setModal({
      isOpen: true,
      title: isEditing ? "Actualizar Usuario" : "Crear Usuario",
      message: isEditing
        ? `¿Guardar cambios para "${newUser.name}"?`
        : `¿Crear al usuario "${newUser.name}"?`,
      type: "warning",
      action: handleSaveUser,
    });
  };

  const confirmDeleteUser = (id: string) => {
    setModal({
      isOpen: true,
      title: "Eliminar Usuario",
      message:
        "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.",
      type: "danger",
      action: async () => {
        await fetch(`/api/users?id=${id}`, { method: "DELETE" });
        await refresh();
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteReport = async (id: string) => {
    setModal({
      isOpen: true,
      title: "Eliminar Reporte",
      message: "¿Estás seguro de eliminar este reporte permanentemente?",
      type: "danger",
      action: async () => {
        try {
          const res = await fetch(`/api/reports?id=${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            // Force immediate refetch
            await refresh();
            toast.success("Reporte eliminado");
          } else {
            toast.error("Error al eliminar el reporte");
          }
        } catch {
          toast.error("Error de conexión");
        }
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleScheduleUpdate = async (
    userId: string,
    newShifts: any[],
    weekStart: string
  ) => {
    try {
      const body: any = { id: userId };

      if (scheduleMode === "default") {
        body.schedule = newShifts;
      } else {
        body.tempSchedule = newShifts;
        body.weekStart = weekStart;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error actualizando horario");

      await refresh();
    } catch (err) {
      console.error("Failed to save schedule", err);
    }
  };

  if (!isAdmin)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Verificando...
      </div>
    );

  if (!isReady) {
    return (
      <div className="configuracion-ui min-h-screen bg-background text-foreground">
        <ConfiguracionSkeleton />
      </div>
    );
  }

  const usersList = users as any[];
  const reportsList = reports as any[];

  const renderUserGrid = (title: string, roleFilter: (r: string) => boolean, icon: any) => {
    const filteredUsers = usersList.filter((u) => roleFilter(u.role));
    if (filteredUsers.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="group relative bg-card border border-border hover:border-primary/30 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 border border-border rounded-lg shadow-sm">
                        <AvatarImage src={u.image} className="rounded-lg object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm rounded-lg">
                          {u.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
                        style={{ backgroundColor: u.lastLogin ? "#10b981" : "#6b7280" }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground tracking-tight leading-none">
                        {u.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono font-medium opacity-60">
                        #{u.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {u.role === "BOSS" ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-semibold tracking-wide uppercase">
                      <Crown className="w-3 h-3 mr-1" /> Coord
                    </div>
                  ) : u.role === "ENGINEER" ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[9px] font-semibold tracking-wide uppercase">
                      <Wrench className="w-3 h-3 mr-1" /> Ing
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border text-[9px] font-semibold tracking-wide uppercase">
                      Operador
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70">
                      Contacto
                    </p>
                    <p className="text-xs text-foreground font-medium truncate">
                      {u.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70">
                        Última Vez
                      </p>
                      <p className="text-xs text-foreground font-medium">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString("es-CR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Desconectado"}
                      </p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70">
                        Ubicación
                      </p>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {u.lastLoginCountry || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex justify-between items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      <Search className="w-3.5 h-3.5 mr-1.5" /> Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border text-foreground max-w-md p-0 overflow-hidden shadow-2xl rounded-xl ring-1 ring-border">
                    <div className="bg-muted/30 border-b border-border p-8">
                      <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20 border border-border rounded-xl shadow-sm">
                          <AvatarImage src={u.image} className="rounded-xl object-cover" />
                          <AvatarFallback className="bg-background text-muted-foreground text-2xl font-semibold rounded-xl">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-primary font-medium text-[10px] uppercase tracking-wide mb-2">
                            {u.role}
                          </div>
                          <h3 className="text-3xl font-semibold tracking-tight text-foreground leading-none">
                            {u.name}
                          </h3>
                          <p className="text-muted-foreground text-xs font-medium mt-2 tracking-tight">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest opacity-70">
                            Último acceso
                          </p>
                          <p className="text-foreground font-semibold text-sm">
                            {u.lastLogin
                              ? new Date(u.lastLogin).toLocaleString("es-CR")
                              : "Nunca"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest opacity-70">
                            IP de conexión
                          </p>
                          <p className="text-foreground font-mono font-medium text-sm tracking-tighter">
                            {u.lastLoginIP || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditUser(u)}
                    className="h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  {u.role !== "BOSS" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteUser(u.id)}
                      className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabClass = (active: boolean) =>
    cn(
      "rounded-sm px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0",
      active
        ? "bg-[#FF0C60]/10 text-[#FF0C60]"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    );

  return (
    <div className="configuracion-ui relative min-h-screen overflow-hidden bg-background pb-20 text-foreground selection:bg-[#FF0C60] selection:text-white">
      <div className="relative z-10">
        <ConfirmModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          onConfirm={modal.action}
          onCancel={() => setModal({ ...modal, isOpen: false })}
          type={modal.type}
        />

        <UserFormDialog
          open={isUserModalOpen}
          onOpenChange={setIsUserModalOpen}
          isEditing={isEditing}
          user={newUser}
          onChange={setNewUser}
          error={error}
          onSubmit={confirmSaveUser}
          onCancel={cancelEdit}
        />

        <div className={`${pageContainerClass} space-y-5`}>
          <section className="border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Settings className="h-3 w-3" />
                  Administración
                </span>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                    Configuración
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    Usuarios, horarios, eventos, códigos de registro y depuración de reportes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  cancelEdit();
                  setIsUserModalOpen(true);
                }}
                className="h-10 shrink-0 gap-2 rounded-sm bg-[#FF0C60] px-4 text-white hover:bg-[#E00A54]"
              >
                <UserPlus className="h-4 w-4" />
                Nuevo operador
              </Button>
            </div>
          </section>

          <div className="flex gap-1 overflow-x-auto border border-border/60 bg-card p-1 shadow-sm no-scrollbar">
            <button type="button" onClick={() => setActiveTab("users")} className={tabClass(activeTab === "users")}>
              Usuarios
            </button>
            <button type="button" onClick={() => setActiveTab("schedule")} className={tabClass(activeTab === "schedule")}>
              Horarios
            </button>
            <button type="button" onClick={() => setActiveTab("events")} className={tabClass(activeTab === "events")}>
              Eventos
            </button>
            <button type="button" onClick={() => setActiveTab("security")} className={tabClass(activeTab === "security")}>
              Seguridad
            </button>
            <button type="button" onClick={() => setActiveTab("reports")} className={tabClass(activeTab === "reports")}>
              Reportes
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-8">
                  <div className="flex flex-col gap-6">
                    <LoginMap users={usersList} />
                    <ActiveUsersWidget users={usersList} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Equipo Total",
                        value: usersList.length,
                        icon: Shield,
                        color: "text-blue-500",
                      },
                      {
                        label: "Coordinadores",
                        value: usersList.filter((u) => u.role === "BOSS").length,
                        icon: Crown,
                        color: "text-amber-500",
                      },
                      {
                        label: "Ingenieros",
                        value: usersList.filter((u) => u.role === "ENGINEER").length,
                        icon: Wrench,
                        color: "text-purple-500",
                      },
                      {
                        label: "Operadores",
                        value: usersList.filter(
                          (u) => !["BOSS", "ENGINEER"].includes(u.role || "")
                        ).length,
                        icon: Shield,
                        color: "text-emerald-500",
                      },
                    ].map((stat, i) => (
                      <Card
                        key={i}
                        className="bg-card border border-border shadow-sm rounded-xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all duration-300"
                      >
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase opacity-60">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-semibold text-foreground mt-1 tracking-tight">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={`w-12 h-12 bg-muted/30 border border-border rounded-md flex items-center justify-center ${stat.color}`}
                        >
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border py-4 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted/30 text-muted-foreground rounded-md flex items-center justify-center border border-border shadow-inner">
                        <Search className="w-5 h-5 opacity-50" />
                      </div>
                      <h3 className="text-[11px] font-semibold tracking-tight text-muted-foreground">
                        Explorador de Personal
                      </h3>
                    </div>
                  </CardHeader>
                  <div className="p-8">
                    <div className="space-y-16">
                      {renderUserGrid(
                        "Coordinadores",
                        (role) => role === "BOSS",
                        <Crown className="w-5 h-5 text-amber-500" />
                      )}
                      {renderUserGrid(
                        "Ingenieros",
                        (role) => role === "ENGINEER",
                        <Wrench className="w-5 h-5 text-purple-500" />
                      )}
                      {renderUserGrid(
                        "Operadores",
                        (role) => !["BOSS", "ENGINEER"].includes(role || ""),
                        <Shield className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden h-fit flex flex-col">
                  <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Gestión de Horarios
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border">
                      <button
                        onClick={() => setScheduleMode("weekly")}
                        className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-all ${
                          scheduleMode === "weekly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Esta Semana (Temp)
                      </button>
                      <button
                        onClick={() => setScheduleMode("default")}
                        className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-all ${
                          scheduleMode === "default"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Fijo (Predeterminado)
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {scheduleMode === "default" && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary z-20 animate-pulse" />
                    )}
                    <WeeklyCalendar
                      operators={usersList.map((u) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email || "",
                        image: u.image,
                        role: u.role || "OPERATOR",
                        shifts:
                          (scheduleMode === "default" ? u.defaultShifts : u.shifts) ||
                          [],
                        isTempSchedule:
                          scheduleMode === "weekly" ? u.isTempSchedule : false,
                      }))}
                      currentWeekStart={currentWeekStart}
                      onWeekChange={setCurrentWeekStart}
                      onUpdateSchedule={handleScheduleUpdate}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SpecialEventsManager />
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card className="bg-card border border-border shadow-sm rounded-xl">
                  <CardHeader className="bg-muted/10 p-8 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl font-semibold text-foreground tracking-tight leading-none flex items-center gap-3">
                          <KeyRound className="w-8 h-8 text-primary" /> Códigos de
                          Registro
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-semibold text-[10px] tracking-tight mt-2 opacity-60">
                          Genere códigos de seguridad para autorizar nuevos
                          operadores. Cada código expira en 24 horas y solo puede
                          usarse una vez.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={generateCode}
                        disabled={codesLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs uppercase tracking-wide shadow-md h-11"
                      >
                        {codesLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <KeyRound className="w-4 h-4 mr-2" />
                        )}
                        Generar Código
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {securityCodes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="w-16 h-16 rounded-xl bg-muted/30 border border-border flex items-center justify-center">
                          <KeyRound className="w-8 h-8 text-muted-foreground opacity-40" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">
                          No hay códigos generados
                        </p>
                        <p className="text-xs text-muted-foreground opacity-60 max-w-sm">
                          Genere un código de seguridad y compártalo con el operador
                          que desea registrarse.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {securityCodes.map((c) => (
                          <div
                            key={c.id}
                            className={`relative bg-card/60 border rounded-xl p-5 space-y-4 transition-all duration-300 ${
                              c.status === "available"
                                ? "border-emerald-500/20 hover:border-emerald-500/40 shadow-sm hover:shadow-emerald-500/5"
                                : c.status === "used"
                                ? "border-border opacity-50"
                                : "border-amber-500/20 opacity-60"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div
                                className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                                  c.status === "available"
                                    ? "text-emerald-500"
                                    : c.status === "used"
                                    ? "text-muted-foreground"
                                    : "text-amber-500"
                                }`}
                              >
                                {c.status === "available" ? (
                                  <Shield className="w-3 h-3" />
                                ) : c.status === "used" ? (
                                  <Shield className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {c.status === "available"
                                  ? "Disponible"
                                  : c.status === "used"
                                  ? "Usado"
                                  : "Expirado"}
                              </div>
                              {c.status === "available" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteCode(c.id)}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p
                                id={`code-${c.code}`}
                                className="text-2xl font-mono font-bold tracking-widest text-center py-2 bg-muted/30 rounded-lg border border-border/50 text-foreground"
                              >
                                {c.code}
                              </p>
                              {c.status === "available" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyCode(c.code)}
                                  className="w-full h-9 text-[10px] font-semibold uppercase tracking-wide border-border hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                                >
                                  <Copy className="w-3 h-3 mr-2" /> Copiar Código
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                              <span>
                                {new Date(c.createdAt).toLocaleString("es-CR", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Exp:{" "}
                                {new Date(c.expiresAt).toLocaleString("es-CR", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {!reportsReady ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-border/60 bg-card">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cargando reportes…</p>
                  </div>
                ) : (
                <Card className="rounded-sm border border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/10 p-8 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl font-semibold text-foreground tracking-tight leading-none">
                          Gestión de reportes
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-semibold text-[10px] tracking-tight mt-2 opacity-60">
                          Filtro y depuración de la base de datos de incidencias.
                        </CardDescription>
                      </div>
                      <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por ID o descripción..."
                          className="pl-12 bg-background border border-input w-full text-sm font-medium tracking-tight h-12 text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-lg ring-offset-background"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30 border-b border-border">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="pl-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">
                            ID Interno
                          </TableHead>
                          <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">
                            Marca de Tiempo
                          </TableHead>
                          <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">
                            Operador
                          </TableHead>
                          <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground w-[40%]">
                            Descripción del Suceso
                          </TableHead>
                          <TableHead className="text-right pr-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border">
                        {reportsList.map((report) => (
                          <TableRow
                            key={report.id}
                            className="border-none hover:bg-muted/20 transition-all duration-200 group"
                          >
                            <TableCell className="pl-8 font-mono text-[10px] text-primary font-medium tracking-tight">
                              #{report.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-foreground text-xs font-semibold tracking-tight">
                              {new Date(report.createdAt).toLocaleDateString(
                                "es-CR",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )}
                            </TableCell>
                            <TableCell className="text-foreground text-xs font-semibold tracking-tight">
                              {report.operatorName}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs font-medium max-w-md truncate">
                              {report.problemDescription}
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDeleteReport(report.id)}
                                className="h-9 w-9 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all rounded-md"
                              >
                                <Trash2 className="w-4 h-4 stroke-[3]" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}