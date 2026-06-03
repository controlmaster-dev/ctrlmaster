"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  Calendar as CalendarIcon,
  Wrench,
  KeyRound,
  Trash2,
  UserPlus,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { UserFormDialog } from "@/components/configuracion/UserFormDialog";
import { SpecialEventsManager } from "@/components/SpecialEventsManager";
import { ConfiguracionSkeleton } from "@/components/skeletons/ConfiguracionSkeleton";
import { ConfiguracionUsersTab } from "@/components/configuracion/ConfiguracionUsersTab";
import { ConfiguracionScheduleTab } from "@/components/configuracion/ConfiguracionScheduleTab";
import { ConfiguracionSecurityTab } from "@/components/configuracion/ConfiguracionSecurityTab";
import {
  ConfiguracionReportsTab,
  type ReportCleanupRow,
} from "@/components/configuracion/ConfiguracionReportsTab";
import type { ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import { useConfiguracionBundle } from "@/hooks/useConfiguracionBundle";
import { useConfiguracionAdmin } from "@/hooks/useConfiguracionAdmin";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { pageContainerClass } from "@/lib/page-layout";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "users", label: "Personal", icon: Shield },
  { id: "schedule", label: "Horarios", icon: CalendarIcon },
  { id: "events", label: "Eventos Especiales", icon: Wrench },
  { id: "security", label: "Códigos de Registro", icon: KeyRound },
  { id: "reports", label: "Depuración", icon: Trash2 },
] as const;

export default function ConfigurationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [currentWeekStart, setCurrentWeekStart] = useState(getSundayWeekStart);
  const [scheduleMode, setScheduleMode] = useState("weekly");

  const { users, reports, securityCodes, isReady, reportsReady, refresh } =
    useConfiguracionBundle(currentWeekStart, isAdmin);

  const admin = useConfiguracionAdmin(refresh);

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

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-medium text-foreground">
        Verificando...
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="configuracion-ui min-h-screen bg-background text-foreground">
        <ConfiguracionSkeleton />
      </div>
    );
  }

  const usersList = users as ConfiguracionUserCard[];

  return (
    <div className="configuracion-ui relative min-h-screen overflow-hidden bg-background pb-20 text-foreground selection:bg-brand selection:text-white">
      <div className="relative z-10">
        <ConfirmModal
          isOpen={admin.modal.isOpen}
          title={admin.modal.title}
          message={admin.modal.message}
          onConfirm={admin.modal.action}
          onCancel={() => admin.setModal({ ...admin.modal, isOpen: false })}
          type={admin.modal.type}
        />

        <UserFormDialog
          open={admin.isUserModalOpen}
          onOpenChange={admin.setIsUserModalOpen}
          isEditing={admin.isEditing}
          user={admin.newUser}
          onChange={admin.setNewUser}
          error={admin.error}
          onSubmit={admin.confirmSaveUser}
          onCancel={admin.cancelEdit}
        />

        <div className={`${pageContainerClass} space-y-5`}>
          <section className="rounded-lg border border-border bg-card p-5 shadow-none transition-all duration-300 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  <Settings className="h-3 w-3" />
                  Panel de Administración
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Configuración del Sistema
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gestione usuarios, horarios, eventos, códigos de seguridad y depuración de
                    reportes.
                  </p>
                </div>
              </div>
              <Button
                onClick={admin.openNewUserModal}
                className="h-10 shrink-0 gap-2 rounded-lg bg-brand px-4 font-medium text-white shadow-none transition-all duration-200 hover:bg-brand-hover"
              >
                <UserPlus className="h-4 w-4" />
                Registrar Operador
              </Button>
            </div>
          </section>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-none">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border-b-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200",
                    active
                      ? "border-b-brand bg-brand/10 text-brand shadow-none"
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
              >
                <ConfiguracionUsersTab
                  users={usersList}
                  onEditUser={admin.handleEditUser}
                  onDeleteUser={admin.confirmDeleteUser}
                />
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
                <ConfiguracionScheduleTab
                  users={usersList}
                  scheduleMode={scheduleMode}
                  onScheduleModeChange={setScheduleMode}
                  currentWeekStart={currentWeekStart}
                  onWeekChange={setCurrentWeekStart}
                  onUpdateSchedule={(userId, shifts, weekStart) =>
                    admin.handleScheduleUpdate(userId, shifts, weekStart, scheduleMode)
                  }
                />
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-lg border border-border bg-card p-5 shadow-none"
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
                <ConfiguracionSecurityTab
                  codes={securityCodes}
                  loading={admin.codesLoading}
                  onGenerate={admin.generateCode}
                  onDelete={admin.deleteCode}
                  onCopy={admin.copyCode}
                />
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
                <ConfiguracionReportsTab
                  reportsReady={reportsReady}
                  reports={reports as ReportCleanupRow[]}
                  onDeleteReport={admin.confirmDeleteReport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
