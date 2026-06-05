"use client";

import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/dashboard/BentoCard";

export type WhatsappHealth = {
  success?: boolean;
  data?: {
    messagesSent?: number;
    messagesFailed?: number;
    queueSize?: number;
  };
} | null;

type DashboardWhatsappCardProps = {
  health: WhatsappHealth;
  onOpenReminder: () => void;
};

export function DashboardWhatsappCard({ health, onOpenReminder }: DashboardWhatsappCardProps) {
  const wa = health;

  return (
    <BentoCard variant="default" className="h-full">
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              wa?.success
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {wa?.success ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">WhatsApp</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {wa?.success ? "Conectado" : wa ? "Desconectado" : "Sin configurar"}
            </p>
          </div>
          {wa?.success && (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Activo
            </span>
          )}
        </div>

        {wa?.data && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Mensajes hoy</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {wa.data.messagesSent || 0}
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Errores</p>
              <p
                className={`text-lg font-semibold tabular-nums ${
                  (wa.data.messagesFailed ?? 0) > 0
                    ? "text-red-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {wa.data.messagesFailed || 0}
              </p>
            </div>
            {(wa.data.queueSize ?? 0) > 0 && (
              <div className="col-span-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  {wa.data.queueSize} mensaje(s) en cola
                </p>
              </div>
            )}
          </div>
        )}

        {!wa && (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Conecta la API de WhatsApp para enviar recordatorios automáticos al equipo.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full gap-2 rounded-lg border-border/40 text-xs font-medium"
          onClick={onOpenReminder}
        >
          <MessageCircle className="h-4 w-4" />
          Enviar recordatorio manual
        </Button>
      </div>
    </BentoCard>
  );
}
