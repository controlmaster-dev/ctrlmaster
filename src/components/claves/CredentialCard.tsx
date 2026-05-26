"use client";

import {
  Copy,
  Eye,
  EyeOff,
  Globe,
  Laptop,
  Lock,
  Monitor,
  MoreHorizontal,
  Pencil,
  Server,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Credential {
  id: string;
  service: string;
  category: string;
  username: string;
  password: string;
  notes?: string | null;
}

const CATEGORY_ICONS: Record<string, typeof Lock> = {
  Producción: Monitor,
  Streaming: Globe,
  Infraestructura: Server,
  General: Lock,
  PC: Laptop,
  Mac: Laptop,
  Windows: Monitor,
  Web: Globe,
};

interface CredentialCardProps {
  cred: Credential;
  showPassword: boolean;
  onTogglePassword: () => void;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onEdit: (cred: Credential) => void;
}

function CopyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export function CredentialCard({
  cred,
  showPassword,
  onTogglePassword,
  onCopy,
  onDelete,
  onEdit,
}: CredentialCardProps) {
  const Icon = CATEGORY_ICONS[cred.category] ?? Lock;

  return (
    <Card className="group overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm transition-colors hover:border-border">
      <div className="p-4">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground" title={cred.service}>
                {cred.service}
              </h3>
              <p className="truncate text-xs text-muted-foreground">{cred.category}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Acciones"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(cred)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(cred.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Usuario</p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <span className="min-w-0 truncate text-sm">{cred.username}</span>
              <CopyButton onClick={() => onCopy(cred.username)} label="Copiar usuario" />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-muted-foreground">Contraseña</p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <span
                className={`min-w-0 truncate font-mono text-sm ${
                  showPassword ? "text-foreground" : "text-muted-foreground/50"
                }`}
              >
                {showPassword ? cred.password : "••••••••••••"}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={onTogglePassword}
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <CopyButton onClick={() => onCopy(cred.password)} label="Copiar contraseña" />
              </div>
            </div>
          </div>
        </div>

        {cred.notes ? (
          <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {cred.notes}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
