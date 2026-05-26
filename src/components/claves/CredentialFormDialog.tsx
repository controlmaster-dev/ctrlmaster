"use client";

import { Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Credential } from "./CredentialCard";

type CredentialFormData = Pick<
  Credential,
  "service" | "category" | "username" | "password" | "notes"
>;

interface CredentialFormDialogProps {
  title: string;
  confirmText: string;
  initialData: CredentialFormData | null;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (data: CredentialFormData) => void;
}

export function CredentialFormDialog({
  title,
  confirmText,
  initialData,
  onSubmit,
  onCancel,
  onChange,
}: CredentialFormDialogProps) {
  const data = initialData ?? {
    service: "",
    category: "",
    username: "",
    password: "",
    notes: "",
  };

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange({ ...data, password: pass });
    toast.info("Contraseña generada");
  };

  const update = (patch: Partial<CredentialFormData>) => onChange({ ...data, ...patch });

  return (
    <DialogContent className="max-w-md rounded-xl border border-border/60 bg-card p-6">
      <DialogHeader className="mb-4 space-y-1">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5 text-[#FF0C60]" />
          {title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Servicio</label>
            <Input
              placeholder="Ej. Adobe"
              className="h-10 rounded-lg border-border/60 bg-muted/20"
              value={data.service}
              onChange={(e) => update({ service: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <Input
              placeholder="Ej. Producción"
              className="h-10 rounded-lg border-border/60 bg-muted/20"
              value={data.category}
              onChange={(e) => update({ category: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Usuario o correo</label>
          <Input
            placeholder="usuario@enlace.org"
            className="h-10 rounded-lg border-border/60 bg-muted/20"
            value={data.username}
            onChange={(e) => update({ username: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Contraseña</label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-xs text-[#FF0C60] hover:text-[#E00A54]"
            >
              Generar segura
            </button>
          </div>
          <div className="relative">
            <Input
              type="text"
              className="h-10 rounded-lg border-border/60 bg-muted/20 pr-10 font-mono text-sm"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => update({ password: e.target.value })}
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="credential-notes" className="text-xs font-medium text-muted-foreground">
            Notas (opcional)
          </label>
          <textarea
            id="credential-notes"
            rows={3}
            placeholder="Detalles adicionales…"
            className="w-full resize-y rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0C60]/30"
            value={data.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            className="flex-1 bg-[#FF0C60] text-white hover:bg-[#E00A54]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
