"use client";

import { Clock, Copy, KeyRound, Loader2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SecurityCode = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

type ConfiguracionSecurityTabProps = {
  codes: SecurityCode[];
  loading: boolean;
  onGenerate: () => void;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
};

export function ConfiguracionSecurityTab({
  codes,
  loading,
  onGenerate,
  onDelete,
  onCopy,
}: ConfiguracionSecurityTabProps) {
  return (
    <Card className="rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border bg-muted/10 p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <KeyRound className="h-5 w-5 text-brand" /> Autorizaciones de Registro
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground opacity-80">
              Genere códigos de seguridad únicos para registrar nuevos operadores. Expiran en 24
              horas y son monouso.
            </CardDescription>
          </div>
          <Button
            onClick={onGenerate}
            disabled={loading}
            className="h-10 rounded-lg bg-brand px-4 text-xs font-medium uppercase tracking-wider text-white shadow-none hover:bg-brand-hover"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Generar Código
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/30">
              <KeyRound className="h-6 w-6 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No hay códigos generados</p>
            <p className="max-w-xs text-xs text-muted-foreground opacity-60">
              Cree un código seguro para compartirlo con el personal que deba registrarse.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {codes.map((c) => (
              <div
                key={c.id}
                className={`relative space-y-3.5 rounded-lg border bg-muted/5 p-4 transition-all duration-200 ${
                  c.status === "available"
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : c.status === "used"
                      ? "border-border opacity-50"
                      : "border-amber-500/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 text-[8px] font-semibold uppercase tracking-widest ${
                      c.status === "available"
                        ? "text-emerald-500"
                        : c.status === "used"
                          ? "text-muted-foreground"
                          : "text-amber-500"
                    }`}
                  >
                    {c.status === "available" ? (
                      <Shield className="h-3 w-3" />
                    ) : c.status === "used" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
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
                      onClick={() => onDelete(c.id)}
                      className="h-6 w-6 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <p
                    id={`code-${c.code}`}
                    className="rounded-lg border border-border/80 bg-background py-1.5 text-center font-mono text-xl font-semibold tracking-widest text-foreground"
                  >
                    {c.code}
                  </p>
                  {c.status === "available" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(c.code)}
                      className="h-8 w-full rounded-md border-border text-[9px] font-semibold uppercase tracking-wider hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                    >
                      <Copy className="mr-1.5 h-3 w-3" /> Copiar Código
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[9px] text-muted-foreground">
                  <span>
                    Creado:{" "}
                    {new Date(c.createdAt).toLocaleDateString("es-CR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-0.5">
                    Exp:{" "}
                    {new Date(c.expiresAt).toLocaleDateString("es-CR", {
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
  );
}
