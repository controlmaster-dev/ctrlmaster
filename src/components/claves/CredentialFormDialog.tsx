"use client";

import { useState } from "react";
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
  const [fieldsLocked, setFieldsLocked] = useState(true);

  const data = initialData ?? {
    service: "",
    category: "",
    username: "",
    password: "",
    notes: "",
  };

  const unlockFields = () => setFieldsLocked(false);

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
          <Shield className="h-5 w-5 text-brand" />
          {title}
        </DialogTitle>
      </DialogHeader>

      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        {/* Evita que el gestor del teléfono rellene credenciales de login */}
        <input
          type="text"
          name="cm-decoy-user"
          autoComplete="username"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          defaultValue=""
          readOnly
        />
        <input
          type="password"
          name="cm-decoy-pass"
          autoComplete="current-password"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          defaultValue=""
          readOnly
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Servicio</label>
            <Input
              id="cm-vault-service"
              name="cm-vault-service"
              placeholder="Ej. Adobe"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={fieldsLocked}
              onFocus={unlockFields}
              className="h-10 rounded-lg border-border/60 bg-muted/20"
              value={data.service}
              onChange={(e) => update({ service: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <Input
              id="cm-vault-category"
              name="cm-vault-category"
              placeholder="Ej. Producción"
              autoComplete="off"
              readOnly={fieldsLocked}
              onFocus={unlockFields}
              className="h-10 rounded-lg border-border/60 bg-muted/20"
              value={data.category}
              onChange={(e) => update({ category: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Usuario o identificador
          </label>
          <Input
            id="cm-vault-identifier"
            name="cm-vault-identifier"
            placeholder="usuario@enlace.org"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={fieldsLocked}
            onFocus={unlockFields}
            className="h-10 rounded-lg border-border/60 bg-muted/20"
            value={data.username}
            onChange={(e) => update({ username: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Clave de acceso</label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-xs text-brand hover:text-brand-hover"
            >
              Generar segura
            </button>
          </div>
          <div className="relative">
            <Input
              id="cm-vault-secret"
              name="cm-vault-secret"
              type="password"
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              readOnly={fieldsLocked}
              onFocus={unlockFields}
              className="h-10 rounded-lg border-border/60 bg-muted/20 pr-10 font-mono text-sm"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => update({ password: e.target.value })}
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cm-vault-notes" className="text-xs font-medium text-muted-foreground">
            Notas (opcional)
          </label>
          <textarea
            id="cm-vault-notes"
            name="cm-vault-notes"
            rows={3}
            autoComplete="off"
            readOnly={fieldsLocked}
            onFocus={unlockFields}
            placeholder="Detalles adicionales…"
            className="w-full resize-y rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            value={data.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-brand text-white hover:bg-brand-hover"
          >
            {confirmText}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
