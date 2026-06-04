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
import { UserFormDialog } from "@/components/configuracion/UserFormDialog";
import { SpecialEventsManager } from "@/components/SpecialEventsManager";
import { ConfiguracionSkeleton } from "@/components/skeletons/ConfiguracionSkeleton";
import { ConfiguracionUsersTab } from "@/components/configuracion/ConfiguracionUsersTab";
import { ConfiguracionScheduleTab } from "@/components/configuracion/ConfiguracionScheduleTab";
import { ConfiguracionSecurityTab } from "@/components/configuracion/ConfiguracionSecurityTab";
import { ConfiguracionReportsTab } from "@/components/configuracion/ConfiguracionReportsTab";
import type { ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import { useConfiguracionBundle } from "@/hooks/useConfiguracionBundle";
import { useConfiguracionAdmin } from "@/hooks/useConfiguracionAdmin";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { pageContainerClass } from "@/lib/page-layout";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "users", label: "Personal", icon: Shield },
  { id: "schedule", label: "Horarios", icon: CalendarIcon },
  { id: "events", label: "Eventos", icon: Wrench },
  { id: "security", label: "Códigos", icon: KeyRound },
  { id: "reports", label: "Depuración", icon: Trash2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ConfigurationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [currentWeekStart, setCurrentWeekStart] = useState(getSundayWeekStart);
  const [scheduleMode, setScheduleMode] = useState("weekly");

  const { users, securityCodes, isReady, refresh } = useConfiguracionBundle(
    currentWeekStart,
    isAdmin
  );

  const admin = useConfiguracionAdmin({ refresh });

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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Verificando acceso…</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <ConfiguracionSkeleton />
      </div>
    );
  }

  const usersList = users as ConfiguracionUserCard[];

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
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
        <BentoCard className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Settings className="h-3.5 w-3.5" />
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
              onClick={admin.openNewUserModal}
              className="h-9 shrink-0 gap-2 bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              <UserPlus className="h-4 w-4" />
              Registrar operador
            </Button>
          </div>
        </BentoCard>

        <nav
          className="flex gap-1 overflow-x-auto rounded-lg border border-border/80 bg-card/50 p-1"
          aria-label="Secciones de configuración"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div key={activeTab} className="animate-in fade-in duration-200">
          {activeTab === "users" && (
            <ConfiguracionUsersTab
              users={usersList}
              onEditUser={admin.handleEditUser}
              onDeleteUser={admin.confirmDeleteUser}
            />
          )}

          {activeTab === "schedule" && (
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
          )}

          {activeTab === "events" && (
            <BentoCard className="overflow-hidden p-4 md:p-5">
              <SpecialEventsManager />
            </BentoCard>
          )}

          {activeTab === "security" && (
            <ConfiguracionSecurityTab
              codes={securityCodes}
              loading={admin.codesLoading}
              onGenerate={admin.generateCode}
              onDelete={admin.deleteCode}
              onCopy={admin.copyCode}
            />
          )}

          {activeTab === "reports" && (
            <ConfiguracionReportsTab
              active
              onDeleteReport={admin.confirmDeleteReport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
