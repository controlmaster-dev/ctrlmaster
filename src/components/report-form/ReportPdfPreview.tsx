"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
import { formatDowntime } from "@/lib/formatDowntime";
import { parseDatetimeLocal } from "@/lib/datetimeLocal";
import {
  formatPdfCategory,
  formatPdfPriority,
  formatPdfReportDate,
  formatPdfResolvedDate,
  formatPdfStatus,
} from "@/lib/reportPdfLabels";
import { cn } from "@/lib/utils";
import { descriptionLengthState } from "@/lib/reportPdfLimits";

const LOGO_URL =
  "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png";

export type ReportPdfPreviewData = {
  operatorName: string;
  operatorEmail: string;
  priority: string[];
  categories: string[];
  problemDescription: string;
  dateStarted: string;
  dateResolved: string;
  isResolved: boolean;
  useManualResolveDate: boolean;
};

function previewResolveDate(data: ReportPdfPreviewData): Date | null {
  if (!data.isResolved) return null;
  if (data.useManualResolveDate && data.dateResolved) {
    return parseDatetimeLocal(data.dateResolved);
  }
  return new Date();
}

function previewStartDate(data: ReportPdfPreviewData): Date {
  if (data.dateStarted) {
    const parsed = parseDatetimeLocal(data.dateStarted);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand">
        {children}
      </h3>
      <div className="mt-1.5 h-px w-full bg-border/60" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-foreground">{value}</p>
    </div>
  );
}

type ReportPdfPreviewProps = {
  data: ReportPdfPreviewData;
  className?: string;
};

export function ReportPdfPreview({ data, className }: ReportPdfPreviewProps) {
  const status = data.isResolved ? "resolved" : "pending";
  const priorityStr = data.priority.join(", ");
  const categoryStr = data.categories.join(", ");
  const started = previewStartDate(data);
  const resolved = previewResolveDate(data);
  const downtime =
    status === "resolved" && resolved
      ? formatDowntime(started, resolved)
      : null;

  const descState = descriptionLengthState(data.problemDescription.length);

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border/60 bg-card/40 p-4 md:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Vista previa del PDF</p>
            <p
              className={cn(
                "text-[10px]",
                descState.tone === "warn" && "text-amber-500/90",
                descState.tone === "error" && "text-destructive",
                descState.tone === "ok" && "text-muted-foreground"
              )}
            >
              {descState.tone === "ok"
                ? "Vista en tema oscuro; el PDF final es fondo blanco."
                : descState.message}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 rounded-lg border border-border/50 bg-background/40 p-2 sm:p-3">
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-brand/[0.04] via-transparent to-violet-600/[0.03]" />

        <div className="relative overflow-hidden rounded-md border border-border/40 bg-card/90 shadow-inner">
          <div className="flex items-start justify-between gap-3 border-b border-border/40 bg-muted/20 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border/50 sm:h-11 sm:w-11">
                <Image
                  src={LOGO_URL}
                  alt="Enlace"
                  width={44}
                  height={44}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight text-foreground sm:text-base">
                  REPORTE DE INCIDENCIA
                </h2>
                <p className="text-[10px] text-brand">
                  Código:{" "}
                  <span className="font-normal text-muted-foreground">
                    se asigna al enviar
                  </span>
                </p>
              </div>
            </div>
            <p className="shrink-0 text-right text-[10px] text-muted-foreground">
              {formatPdfReportDate(started)}
            </p>
          </div>

          <div className="space-y-4 px-3 py-3 sm:px-4 sm:py-4">
            <div>
              <SectionTitle>Información general</SectionTitle>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4">
                <Field
                  label="Canal afectado"
                  value={formatPdfPriority(priorityStr)}
                />
                <Field
                  label="Tipo de incidencia"
                  value={formatPdfCategory(categoryStr)}
                />
                <div className="flex gap-2">
                  <div
                    className={cn(
                      "mt-4 h-3 w-1 shrink-0 rounded-sm",
                      status === "resolved" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  <Field
                    label="Estado actual"
                    value={formatPdfStatus(status)}
                  />
                </div>
                <Field
                  label="Fecha resolución"
                  value={resolved ? formatPdfResolvedDate(resolved) : "—"}
                />
              </div>

              {downtime && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/25 bg-brand/10 px-3 py-2">
                  <span className="text-[10px] font-bold text-foreground">
                    Tiempo total de avería:
                  </span>
                  <span className="text-xs font-bold text-brand">{downtime}</span>
                </div>
              )}
            </div>

            <div>
              <SectionTitle>Detalle del problema</SectionTitle>
              <div className="min-h-[64px] max-h-40 overflow-y-auto rounded-lg border border-border/50 bg-muted/25 px-3 py-2.5 custom-scrollbar">
                <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/90">
                  {data.problemDescription.trim() || "—"}
                </p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-3">
              <p className="text-[10px] font-semibold text-foreground">
                Operador responsable
              </p>
              <p className="text-[10px] text-foreground/90">
                {data.operatorName || "—"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {data.operatorEmail || "—"}
              </p>
            </div>
          </div>

          <div className="h-1 bg-brand" />
          <p className="py-2 text-center text-[8px] text-muted-foreground/80">
            Generado automáticamente por Sistema de Control Máster
          </p>
        </div>
      </div>
    </section>
  );
}
