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
  Users,
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
} from "@/components/ui/dialog";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import dynamic from "next/dynamic";

const LoginMap = dynamic(
  () => import("@/components/LoginMap").then((m) => m.LoginMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted/40" />
    ),
  }
);
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget";
import { SpecialEventsManager } from "@/components/SpecialEventsManager";
import { ConfiguracionSkeleton } from "@/components/skeletons/ConfiguracionSkeleton";
import { UserRoleGridSection, type ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import { useConfiguracionBundle } from "@/hooks/useConfiguracionBundle";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { pageContainerClass } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import type { Shift } from "@/lib/types";

type EditableUser = ConfiguracionUserCard & {
  birthday?: string;
  schedule?: string | Shift[];
};

type SaveUserBody = Omit<UserFormState, "password"> & {
  id?: string;
  password?: string;
};

type ReportCleanupRow = {
  id: string;
  createdAt: string | Date;
  operatorName: string;
  problemDescription: string;
};

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
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void refresh();
    }, 60000);
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

  const handleEditUser = (user: EditableUser) => {
    setIsEditing(true);
    setEditId(user.id);

    let schedule: Shift[] = [];
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
      email: user.email || "",
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
      const body: SaveUserBody = { ...newUser };

      if (isEditing) {
        if (editId) body.id = editId;
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
    newShifts: Shift[],
    weekStart: string
  ) => {
    try {
      const body: { id: string; schedule?: Shift[]; tempSchedule?: Shift[]; weekStart?: string } = { id: userId };

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
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-medium">
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

  const usersList = users as ConfiguracionUserCard[];
  const reportsList = reports as ReportCleanupRow[];

  return (
    <div className="configuracion-ui relative min-h-screen overflow-hidden bg-background pb-20 text-foreground selection:bg-brand selection:text-white">
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

          <section className="rounded-lg border border-border bg-card shadow-none p-5 md:p-6 transition-all duration-300">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                    <Settings className="h-3 w-3" />
                    Panel de Administración
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Configuración del Sistema
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gestione usuarios, horarios de turnos, eventos especiales, códigos de seguridad y depuración de reportes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  cancelEdit();
                  setIsUserModalOpen(true);
                }}
                className="h-10 shrink-0 gap-2 rounded-lg bg-brand px-4 font-medium text-white shadow-none hover:bg-brand-hover transition-all duration-200"
              >
                <UserPlus className="h-4 w-4" />
                Registrar Operador
              </Button>
            </div>
          </section>


          <div className="flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-none no-scrollbar">
            {[
              { id: "users", label: "Personal", icon: Shield },
              { id: "schedule", label: "Horarios", icon: CalendarIcon },
              { id: "events", label: "Eventos Especiales", icon: Wrench },
              { id: "security", label: "Códigos de Registro", icon: KeyRound },
              { id: "reports", label: "Depuración", icon: Trash2 },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 border-b-2",
                    active
                      ? "bg-brand/10 border-b-brand text-brand shadow-none"
                      : "border-b-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Equipo Total",
                      value: usersList.length,
                      icon: Users,
                      color: "text-brand",
                      bg: "bg-brand/5 border-brand/10",
                    },
                    {
                      label: "Coordinadores",
                      value: usersList.filter((u) => u.role === "BOSS").length,
                      icon: Crown,
                      color: "text-amber-500",
                      bg: "bg-amber-500/5 border-amber-500/10",
                    },
                    {
                      label: "Ingenieros",
                      value: usersList.filter((u) => u.role === "ENGINEER").length,
                      icon: Wrench,
                      color: "text-purple-500",
                      bg: "bg-purple-500/5 border-purple-500/10",
                    },
                    {
                      label: "Operadores",
                      value: usersList.filter(
                        (u) => !["BOSS", "ENGINEER"].includes(u.role || "")
                      ).length,
                      icon: Shield,
                      color: "text-blue-500",
                      bg: "bg-blue-500/5 border-blue-500/10",
                    },
                  ].map((stat, i) => (
                    <Card
                      key={i}
                      className="bg-card border border-border shadow-none rounded-lg p-5 flex items-center justify-between group hover:border-foreground/15 transition-all duration-200"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-semibold text-foreground mt-1 tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={cn("w-10 h-10 border rounded-lg flex items-center justify-center transition-all group-hover:scale-105 duration-200", stat.bg, stat.color)}
                      >
                        <stat.icon className="w-5 h-5 shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>


                <Card className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-border py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted/40 text-muted-foreground rounded-lg flex items-center justify-center border border-border">
                        <Search className="w-4 h-4 opacity-75" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Explorador de Personal
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Listado de colaboradores registrados según su cargo y perfil de usuario.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-12">
                      <UserRoleGridSection
                        title="Coordinadores"
                        users={usersList}
                        roleFilter={(role) => role === "BOSS"}
                        icon={<Crown className="w-4 h-4 text-amber-500" />}
                        onEditUser={handleEditUser}
                        onDeleteUser={confirmDeleteUser}
                      />
                      <UserRoleGridSection
                        title="Ingenieros"
                        users={usersList}
                        roleFilter={(role) => role === "ENGINEER"}
                        icon={<Wrench className="w-4 h-4 text-purple-500" />}
                        onEditUser={handleEditUser}
                        onDeleteUser={confirmDeleteUser}
                      />
                      <UserRoleGridSection
                        title="Operadores"
                        users={usersList}
                        roleFilter={(role) => !["BOSS", "ENGINEER"].includes(role || "")}
                        icon={<Shield className="w-4 h-4 text-blue-500" />}
                        onEditUser={handleEditUser}
                        onDeleteUser={confirmDeleteUser}
                      />
                    </div>
                  </CardContent>
                </Card>


                <Card className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-border py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted/40 text-muted-foreground rounded-lg flex items-center justify-center border border-border">
                        <MapPin className="w-4 h-4 opacity-75" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Actividad y Conexión de la Plataforma
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Ubicación geográfica de los accesos y estado en tiempo real del personal.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col gap-6">
                    <LoginMap users={usersList} />
                    <ActiveUsersWidget users={usersList} />
                  </CardContent>
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
                <Card className="bg-card border border-border shadow-none rounded-lg overflow-hidden h-fit flex flex-col">
                  <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground leading-none">
                          Gestión de Horarios
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Configuración del esquema y asignación semanal de turnos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border shrink-0">
                      <button
                        onClick={() => setScheduleMode("weekly")}
                        className={`px-3 py-1 rounded-[4px] text-[9px] font-semibold uppercase tracking-wider transition-all ${
                          scheduleMode === "weekly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Semanal (Temp)
                      </button>
                      <button
                        onClick={() => setScheduleMode("default")}
                        className={`px-3 py-1 rounded-[4px] text-[9px] font-semibold uppercase tracking-wider transition-all ${
                          scheduleMode === "default"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Predeterminado
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {scheduleMode === "default" && (
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-brand z-20 animate-pulse" />
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
                className="rounded-lg border border-border bg-card overflow-hidden shadow-none p-5"
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
                <Card className="bg-card border border-border shadow-none rounded-lg">
                  <CardHeader className="bg-muted/10 p-6 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-brand" /> Autorizaciones de Registro
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-xs opacity-80 mt-1">
                          Genere códigos de seguridad únicos para registrar nuevos operadores. Expiran en 24 horas y son monouso.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={generateCode}
                        disabled={codesLoading}
                        className="bg-brand hover:bg-brand-hover text-white font-medium text-xs uppercase tracking-wider shadow-none h-10 rounded-lg px-4"
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
                  <CardContent className="p-6">
                    {securityCodes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-muted/30 border border-border flex items-center justify-center">
                          <KeyRound className="w-6 h-6 text-muted-foreground opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          No hay códigos generados
                        </p>
                        <p className="text-xs text-muted-foreground opacity-60 max-w-xs">
                          Cree un código seguro para compartirlo con el personal que deba registrarse.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {securityCodes.map((c) => (
                          <div
                            key={c.id}
                            className={`relative bg-muted/5 border rounded-lg p-4 space-y-3.5 transition-all duration-200 ${
                              c.status === "available"
                                ? "border-emerald-500/20 hover:border-emerald-500/40"
                                : c.status === "used"
                                ? "border-border opacity-50"
                                : "border-amber-500/20 opacity-60"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-[8px] font-semibold uppercase tracking-widest flex items-center gap-1 ${
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
                              </span>
                              {c.status === "available" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteCode(c.id)}
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p
                                id={`code-${c.code}`}
                                className="text-xl font-mono font-semibold tracking-widest text-center py-1.5 bg-background rounded-lg border border-border/80 text-foreground"
                              >
                                {c.code}
                              </p>
                              {c.status === "available" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyCode(c.code)}
                                  className="w-full h-8 text-[9px] font-semibold uppercase tracking-wider border-border hover:border-primary/20 hover:text-primary hover:bg-primary/5 rounded-md"
                                >
                                  <Copy className="w-3 h-3 mr-1.5" /> Copiar Código
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-2 border-t border-border/40">
                              <span>
                                Creado: {new Date(c.createdAt).toLocaleDateString("es-CR", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="flex items-center gap-0.5">
                                Exp: {new Date(c.expiresAt).toLocaleDateString("es-CR", {
                                  month: "short",
                                  day: "numeric",
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
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 border border-border bg-card rounded-lg shadow-none">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Cargando base de datos de reportes…</p>
                  </div>
                ) : (
                  <Card className="rounded-lg border border-border bg-card shadow-none">
                    <CardHeader className="bg-muted/10 p-6 border-b border-border">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-foreground tracking-tight">
                            Depuración de Reportes
                          </CardTitle>
                          <CardDescription className="text-muted-foreground text-xs opacity-80">
                            Filtre e inspeccione el registro de incidencias del sistema para su depuración o auditoría.
                          </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-[260px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por ID o descripción..."
                            className="pl-9 bg-background border border-input w-full text-xs font-medium tracking-tight h-10 text-foreground focus-visible:ring-1 focus-visible:ring-brand/30 rounded-lg"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table className="text-xs">
                        <TableHeader className="bg-muted/30 border-b border-border">
                          <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="pl-6 h-10 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                              ID Interno
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                              Fecha
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                              Operador
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase w-[40%]">
                              Descripción del Reporte
                            </TableHead>
                            <TableHead className="text-right pr-6 h-10 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                              Acción
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60">
                          {reportsList.map((report) => (
                            <TableRow
                              key={report.id}
                              className="border-none hover:bg-muted/10 transition-all duration-150 group"
                            >
                              <TableCell className="pl-6 font-mono text-[10px] text-primary font-semibold tracking-tight">
                                #{report.id.slice(0, 8)}
                              </TableCell>
                              <TableCell className="text-foreground font-medium tracking-tight">
                                {new Date(report.createdAt).toLocaleDateString(
                                  "es-CR",
                                  { day: "2-digit", month: "short", year: "numeric" }
                                )}
                              </TableCell>
                              <TableCell className="text-foreground font-medium tracking-tight">
                                {report.operatorName}
                              </TableCell>
                              <TableCell className="text-muted-foreground font-medium max-w-md truncate">
                                {report.problemDescription}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDeleteReport(report.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 transition-all rounded-[2px]"
                                >
                                  <Trash2 className="w-4 h-4" />
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
