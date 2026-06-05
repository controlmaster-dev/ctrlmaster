"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { UserFormState } from "@/components/configuracion/UserFormDialog";
import type { ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import type { Shift } from "@/lib/types";
import { notifyReportDataChanged } from "@/lib/reportCacheSync";

type EditableUser = ConfiguracionUserCard & {
  birthday?: string;
  schedule?: string | Shift[];
};

type SaveUserBody = Omit<UserFormState, "password"> & {
  id?: string;
  password?: string;
};

type ConfirmModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  action: () => void;
  type: "danger" | "warning";
};

const emptyUser = (): UserFormState => ({
  name: "",
  email: "",
  password: "password123",
  role: "OPERATOR",
  schedule: [],
  birthday: "",
});

type ConfiguracionAdminDeps = {
  refresh: () => Promise<void>;
};

export function useConfiguracionAdmin({ refresh }: ConfiguracionAdminDeps) {
  const [modal, setModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    type: "danger",
  });
  const [newUser, setNewUser] = useState<UserFormState>(emptyUser());
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [codesLoading, setCodesLoading] = useState(false);

  const generateCode = useCallback(async () => {
    setCodesLoading(true);
    try {
      const res = await fetch("/api/auth/registration-codes", { method: "POST" });
      if (!res.ok) throw new Error("Error generando código");
      await refresh();
    } catch (e) {
      console.error("Error generating code", e);
    } finally {
      setCodesLoading(false);
    }
  }, [refresh]);

  const deleteCode = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/auth/registration-codes?id=${id}`, { method: "DELETE" });
        await refresh();
      } catch (e) {
        console.error("Error deleting code", e);
      }
    },
    [refresh]
  );

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    const el = document.getElementById(`code-${code}`);
    if (el) {
      el.textContent = "¡Copiado!";
      setTimeout(() => {
        el.textContent = code;
      }, 1500);
    }
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditId(null);
    setNewUser(emptyUser());
    setIsUserModalOpen(false);
  }, []);

  const handleEditUser = useCallback((user: EditableUser) => {
    setIsEditing(true);
    setEditId(user.id);

    let schedule: Shift[] = [];
    try {
      if (user.defaultShifts?.length) {
        schedule = user.defaultShifts;
      } else if (user.shifts?.length) {
        schedule = JSON.parse(JSON.stringify(user.shifts));
      } else {
        schedule =
          typeof user.schedule === "string" ? JSON.parse(user.schedule) : user.schedule || [];
      }
    } catch {
    }

    setNewUser({
      name: user.name,
      email: user.email || "",
      password: "",
      role: user.role || "OPERATOR",
      schedule,
      birthday: user.birthday || "",
    });
    setIsUserModalOpen(true);
  }, []);

  const handleSaveUser = useCallback(async () => {
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
    } catch {
      setError("No se pudo guardar los cambios");
    }
  }, [isEditing, editId, newUser, refresh, cancelEdit]);

  const confirmSaveUser = useCallback(
    (e: React.FormEvent) => {
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
    },
    [isEditing, newUser.name, handleSaveUser]
  );

  const confirmDeleteUser = useCallback(
    (id: string) => {
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
    },
    [refresh]
  );

  const confirmDeleteReport = useCallback(
    (id: string, onRemoved?: (id: string) => void) => {
      setModal({
        isOpen: true,
        title: "Eliminar Reporte",
        message: "¿Estás seguro de eliminar este reporte permanentemente?",
        type: "danger",
        action: async () => {
          setModal((prev) => ({ ...prev, isOpen: false }));
          try {
            const res = await fetch(`/api/reports?id=${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (res.ok) {
              onRemoved?.(id);
              notifyReportDataChanged(id);
              toast.success("Reporte eliminado");
            } else {
              await refresh();
              toast.error("Error al eliminar el reporte");
            }
          } catch {
            await refresh();
            toast.error("Error de conexión");
          }
        },
      });
    },
    [refresh]
  );

  const handleScheduleUpdate = useCallback(
    async (userId: string, newShifts: Shift[], weekStart: string, scheduleMode: string) => {
      try {
        const body: {
          id: string;
          schedule?: Shift[];
          tempSchedule?: Shift[];
          weekStart?: string;
        } = { id: userId };
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
    },
    [refresh]
  );

  const openNewUserModal = useCallback(() => {
    cancelEdit();
    setIsUserModalOpen(true);
  }, [cancelEdit]);

  return {
    modal,
    setModal,
    newUser,
    setNewUser,
    isEditing,
    isUserModalOpen,
    setIsUserModalOpen,
    error,
    codesLoading,
    generateCode,
    deleteCode,
    copyCode,
    cancelEdit,
    handleEditUser,
    confirmSaveUser,
    confirmDeleteUser,
    confirmDeleteReport,
    handleScheduleUpdate,
    openNewUserModal,
  };
}
