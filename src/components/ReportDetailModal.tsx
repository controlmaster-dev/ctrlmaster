"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReportSocials } from "@/components/ReportSocials";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User as UserIcon,
  Tag,
  Calendar,
  Eye,
  ArrowLeft,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getReportDetailCache, prefetchReportDetail } from "@/lib/reportDetailCache";
import { cn } from "@/lib/utils";

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  currentUser: any;
  onUpdate: () => void;
  initialDetail?: any | null;
}

function StatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "resolved") {
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Resuelto
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className={`${base} bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30`}>
        <Clock className="h-3.5 w-3.5" />
        Pendiente
      </span>
    );
  }
  return (
    <span className={`${base} bg-muted text-muted-foreground ring-1 ring-border`}>
      <AlertCircle className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 min-w-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground capitalize truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ReportDetailModal({
  isOpen,
  onClose,
  report,
  currentUser,
  onUpdate,
  initialDetail,
}: ReportDetailModalProps) {
  const [fullReport, setFullReport] = React.useState<any>(null);
  const [loadingSocials, setLoadingSocials] = React.useState(false);

  const loadDetail = React.useCallback(async (reportId: string, silent = false) => {
    if (!silent) setLoadingSocials(true);
    try {
      const data = await prefetchReportDetail(reportId);
      if (data) setFullReport(data);
    } catch (err) {
      console.error("Failed to load report details", err);
    } finally {
      if (!silent) setLoadingSocials(false);
    }
  }, []);

  const refreshDetail = React.useCallback(() => {
    if (report?.id) loadDetail(report.id);
  }, [report?.id, loadDetail]);

  React.useEffect(() => {
    if (!isOpen || !report?.id) {
      setFullReport(null);
      setLoadingSocials(false);
      return;
    }

    const cached =
      initialDetail?.id === report.id
        ? initialDetail
        : getReportDetailCache(report.id);

    if (cached) {
      setFullReport(cached);
      setLoadingSocials(false);
      loadDetail(report.id, true);
    } else {
      loadDetail(report.id);
    }

    if (currentUser) {
      fetch("/api/reports/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, userId: currentUser.id }),
      }).catch(console.error);
    }
  }, [isOpen, report?.id, currentUser, loadDetail, initialDetail]);

  React.useEffect(() => {
    if (isOpen && initialDetail?.id === report?.id) {
      setFullReport(initialDetail);
      setLoadingSocials(false);
    }
  }, [isOpen, initialDetail, report?.id]);

  const handleSocialUpdate = React.useCallback(() => {
    refreshDetail();
    onUpdate();
  }, [refreshDetail, onUpdate]);

  const displayReport = fullReport?.id ? fullReport : report;

  if (!displayReport?.id) return null;

  const shortId = String(displayReport.id).slice(0, 6);
  const createdAt = new Date(displayReport.createdAt);
  const hasAttachments =
    displayReport.attachments && displayReport.attachments.length > 0;
  const hasViews = displayReport.views && displayReport.views.length > 0;

  const openAttachment = (file: { data?: string; url?: string }) => {
    const src = file.data || file.url;
    if (!src) return;
    if (src.startsWith("data:") || src.startsWith("http") || src.startsWith("/")) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${src}" frameborder="0" style="border:0;top:0;left:0;bottom:0;right:0;width:100%;height:100%;" allowfullscreen></iframe>`
        );
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "fixed !z-[50000] flex flex-col gap-0 overflow-hidden p-0",
          "!left-0 !top-0 !right-0 !bottom-0 !w-[100vw] !h-[100dvh] !max-w-none !rounded-none !border-0",
          "!translate-x-0 !translate-y-0 bg-background shadow-none",
          "md:!left-1/2 md:!top-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2",
          "md:!w-[min(96vw,72rem)] md:!h-[min(92dvh,900px)] md:!max-h-[92dvh]",
          "md:rounded-2xl md:border md:border-border md:shadow-2xl md:ring-1 md:ring-border/50"
        )}
      >
        {/* Cabecera */}
        <header className="shrink-0 border-b border-border bg-muted/30 px-4 py-4 md:px-8 md:py-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onClose}
              className="md:hidden mt-0.5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <DialogTitle className="text-xl font-bold tracking-tight md:text-2xl">
                  Reporte #{shortId}
                </DialogTitle>
                <StatusBadge status={displayReport.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {createdAt.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="hidden text-border sm:inline">·</span>
                <span className="text-xs text-muted-foreground/80">
                  {createdAt.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Metadatos */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
            <MetaItem
              icon={UserIcon}
              label="Operador"
              value={displayReport.operatorName}
            />
            <MetaItem
              icon={Tag}
              label="Categoría"
              value={displayReport.category}
            />
            <MetaItem
              icon={AlertCircle}
              label="Prioridad"
              value={displayReport.priority}
            />
          </div>

          {hasViews && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>
                Visto por{" "}
                <span className="text-foreground/80">
                  {displayReport.views.map((v: { user: { name: string } }) => v.user.name).join(", ")}
                </span>
              </span>
            </div>
          )}
        </header>

        {/* Cuerpo: descripción | actividad */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* Descripción */}
          <section className="flex min-h-0 flex-col border-b border-border md:w-[44%] md:border-b-0 md:border-r">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 md:px-6">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Descripción del problema
              </h3>
            </div>

            <ScrollArea className="flex-1 px-4 py-4 md:px-6 md:py-5">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">
                {displayReport.problemDescription}
              </p>

              {hasAttachments && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Adjuntos ({displayReport.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {displayReport.attachments.map((file: { data?: string; url?: string }, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => openAttachment(file)}
                        className="group flex h-28 w-28 flex-col items-center justify-center rounded-xl border border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                          <div className="ml-0.5 h-0 w-0 border-b-[7px] border-l-[12px] border-t-[7px] border-b-transparent border-l-current border-t-transparent" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                          Ver video
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </section>

          {/* Actividad */}
          <section className="flex min-h-0 flex-1 flex-col bg-muted/10">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 md:px-6">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Actividad y comentarios
              </h3>
              {!loadingSocials &&
                (displayReport.comments?.length > 0 ||
                  displayReport.reactions?.length > 0) && (
                  <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
                    {displayReport.comments?.length || 0} comentario
                    {(displayReport.comments?.length || 0) !== 1 ? "s" : ""}
                  </Badge>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6 md:py-5">
              {loadingSocials &&
              !(fullReport?.comments?.length || fullReport?.reactions?.length) ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Cargando actividad...
                  </p>
                </div>
              ) : (
                <ReportSocials
                  embedded
                  reportId={displayReport.id}
                  currentUser={currentUser}
                  initialComments={displayReport.comments || []}
                  initialReactions={displayReport.reactions || []}
                  availableUsers={displayReport.mentionUsers || []}
                  onUpdate={handleSocialUpdate}
                />
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
