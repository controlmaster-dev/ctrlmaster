"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { motion, AnimatePresence } from "framer-motion";
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

export default function ConfigurationPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const getInitialWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));

    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, "0");
    const d = String(sunday.getDate()).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(getInitialWeekStart());
  const [scheduleMode, setScheduleMode] = useState("weekly");

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    type: "danger" as "danger" | "warning",
  });

  const [newUser, setNewUser] = useState({
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
  const [securityCodes, setSecurityCodes] = useState<any[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(savedUser);

    const allowedEmails = ["knunez@enlace.org", "rjimenez@enlace.org"];
    const allowedUsernames = ["knunez", "rjimenez"];

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
  }, [isAdmin, currentWeekStart]);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/auth/registration-codes");
      const data = await res.json();
      if (Array.isArray(data)) setSecurityCodes(data);
    } catch (e) {
      console.error("Error fetching codes", e);
    }
  };

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
      await fetchCodes();
    } catch (e) {
      console.error("Error generating code", e);
    } finally {
      setCodesLoading(false);
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await fetch(`/api/auth/registration-codes?id=${id}`, { method: "DELETE" });
      await fetchCodes();
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

  const fetchData = async () => {
    try {
      const [usersRes, reportsRes] = await Promise.all([
        fetch(`/api/users?weekStart=${currentWeekStart}`),
        fetch("/api/reports"),
      ]);
      const usersData = await usersRes.json();
      const reportsData = await reportsRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(reportsData)) setReports(reportsData);
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
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

      await fetchData();
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
        await fetchData();
        setModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteReport = (id: string) => {
    setModal({
      isOpen: true,
      title: "Eliminar Reporte",
      message: "¿Estás seguro de eliminar este reporte permanentemente?",
      type: "danger",
      action: async () => {
        await fetch(`/api/reports?id=${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        await fetchData();
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

      await fetchData();
    } catch (err) {
      console.error("Failed to save schedule", err);
    }
  };

  if (!isAdmin && loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Verificando...
      </div>
    );
  if (!isAdmin) return null;

  const renderUserGrid = (title: string, roleFilter: (r: string) => boolean, icon: any) => {
    const filteredUsers = users.filter((u) => roleFilter(u.role));
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-primary/25 selection:text-foreground pb-20">
      <div className="relative z-10 text-foreground">
        <ConfirmModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          onConfirm={modal.action}
          onCancel={() => setModal({ ...modal, isOpen: false })}
          type={modal.type}
        />

        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-border text-foreground p-0 overflow-hidden shadow-lg rounded-xl">
            <div className="relative">
              <div className="absolute inset-0 h-32 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

              <div className="relative bg-muted/30 border-b border-border p-8 flex items-center gap-6">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md ring-1 ring-primary-foreground/20">
                  {isEditing ? (
                    <Settings className="w-7 h-7" />
                  ) : (
                    <UserPlus className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground mb-1">
                    {isEditing ? "Editar Perfil y Horario" : "Registrar Nuevo Operador"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />{" "}
                    Gestión de credenciales y turnos fijos
                  </DialogDescription>
                </div>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                <form id="user-form" onSubmit={confirmSaveUser} className="space-y-10">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold p-4 rounded-lg"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      <h4 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Datos Personales
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">
                          NOMBRE COMPLETO
                        </Label>
                        <Input
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                          }
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground h-12 text-sm font-medium uppercase rounded-lg transition-all ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          required
                          placeholder="EJ. JUAN PÉREZ"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">
                          CORREO CORPORATIVO
                        </Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                          }
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground h-12 text-sm font-medium rounded-lg transition-all ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          required
                          placeholder="usuario@enlace.org"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      <h4 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Seguridad y Rango
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">
                          CARGO DESIGNADO
                        </Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                        >
                          <SelectTrigger className="bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg uppercase ring-offset-background focus:ring-2 focus:ring-ring">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem
                              value="OPERATOR"
                              className="focus:bg-accent focus:text-accent-foreground hover:bg-muted"
                            >
                              Operador
                            </SelectItem>
                            <SelectItem
                              value="ENGINEER"
                              className="focus:bg-accent focus:text-accent-foreground hover:bg-muted"
                            >
                              Ingeniero
                            </SelectItem>
                            <SelectItem
                              value="BOSS"
                              className="focus:bg-accent focus:text-accent-foreground hover:bg-muted"
                            >
                              Coordinador
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">
                          CONTRASEÑA DE ACCESO
                        </Label>
                        <Input
                          value={newUser.password}
                          onChange={(e) =>
                            setNewUser({ ...newUser, password: e.target.value })
                          }
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground h-12 text-sm font-medium rounded-lg transition-all ring-offset-background focus-visible:ring-2 focus-visible:ring-ring font-mono"
                          required={!isEditing}
                          type="password"
                          placeholder={isEditing ? "SIN CAMBIOS" : "••••••••"}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      <h4 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Celebraciones
                      </h4>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">
                        FECHA DE CUMPLEAÑOS
                      </Label>
                      <div className="flex gap-4">
                        <Select
                          value={
                            newUser.birthday ? newUser.birthday.split("-")[0] : undefined
                          }
                          onValueChange={(m) => {
                            const parts = newUser.birthday.split("-");
                            const d = parts[1] || "01";
                            setNewUser({ ...newUser, birthday: `${m}-${d}` });
                          }}
                        >
                          <SelectTrigger className="bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg flex-1 ring-offset-background focus:ring-2 focus:ring-ring">
                            <SelectValue placeholder="MES" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground max-h-60">
                            {[
                              "01",
                              "02",
                              "03",
                              "04",
                              "05",
                              "06",
                              "07",
                              "08",
                              "09",
                              "10",
                              "11",
                              "12",
                            ].map((m) => (
                              <SelectItem
                                key={m}
                                value={m}
                                className="focus:bg-accent focus:text-accent-foreground hover:bg-muted"
                              >
                                {new Date(2000, parseInt(m) - 1, 1)
                                  .toLocaleString("es-CR", { month: "long" })
                                  .toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={
                            newUser.birthday ? newUser.birthday.split("-")[1] : undefined
                          }
                          onValueChange={(d) => {
                            const parts = newUser.birthday.split("-");
                            const m = parts[0] || "01";
                            setNewUser({ ...newUser, birthday: `${m}-${d}` });
                          }}
                        >
                          <SelectTrigger className="bg-background border-input text-foreground h-12 text-sm font-medium rounded-lg w-32 ring-offset-background focus:ring-2 focus:ring-ring">
                            <SelectValue placeholder="DÍA" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground max-h-60">
                            {Array.from({ length: 31 }, (_, i) =>
                              (i + 1).toString().padStart(2, "0")
                            ).map((d) => (
                              <SelectItem
                                key={d}
                                value={d}
                                className="focus:bg-accent focus:text-accent-foreground hover:bg-muted"
                              >
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      <h4 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Planificación de Turnos
                      </h4>
                    </div>
                    <ScheduleEditor
                      value={newUser.schedule}
                      onChange={(s: any) => setNewUser({ ...newUser, schedule: s })}
                    />
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-border bg-muted/10 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-12 px-6 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  CANCELAR
                </Button>
                <button
                  form="user-form"
                  type="submit"
                  className="px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] uppercase tracking-wide rounded-lg transition-all shadow-md active:scale-95"
                >
                  {isEditing ? "GUARDAR CAMBIOS" : "CONFIRMAR REGISTRO"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="max-w-[1600px] mx-auto p-4 md:p-10 pt-20 md:pt-6 space-y-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Settings className="w-8 h-8 text-primary" /> Configuración
              </h1>
              <p className="text-muted-foreground mt-1 text-base md:text-lg font-medium">
                Administración de usuarios y limpieza de base de datos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
              <Button
                onClick={() => {
                  cancelEdit();
                  setIsUserModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 md:h-14 px-8 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wide transition-all"
              >
                <UserPlus className="w-5 h-5" /> Nuevo Operador
              </Button>

              <div className="flex bg-muted/20 p-1.5 rounded-lg border border-border w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth snap-x">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${
                    activeTab === "users"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Usuarios
                </button>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${
                    activeTab === "schedule"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Horarios
                </button>
                <button
                  onClick={() => setActiveTab("events")}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${
                    activeTab === "events"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Eventos
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${
                    activeTab === "security"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Seguridad
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 snap-start ${
                    activeTab === "reports"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Reportes
                </button>
              </div>
            </div>
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
                    <LoginMap users={users} />
                    <ActiveUsersWidget users={users} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Equipo Total",
                        value: users.length,
                        icon: Shield,
                        color: "text-blue-500",
                      },
                      {
                        label: "Coordinadores",
                        value: users.filter((u) => u.role === "BOSS").length,
                        icon: Crown,
                        color: "text-amber-500",
                      },
                      {
                        label: "Ingenieros",
                        value: users.filter((u) => u.role === "ENGINEER").length,
                        icon: Wrench,
                        color: "text-purple-500",
                      },
                      {
                        label: "Operadores",
                        value: users.filter(
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
                      operators={users.map((u) => ({
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
                <Card className="bg-card border border-border shadow-sm rounded-xl">
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
                        {reports.map((report) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}