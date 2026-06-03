"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ReportSocials,
  type CommentItem,
  type ReactionItem,
  type SocialUser,
} from "@/components/ReportSocials";
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
import {
  getReportDetailCache,
  patchReportDetailSocials,
  prefetchReportDetail,
} from "@/lib/reportDetailCache";
import { fetchMentionUsers, getCachedMentionUsers } from "@/lib/mentionUsersCache";
import { cn } from "@/lib/utils";
import { formatReportDisplayId } from "@/lib/reportCode";

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportDetail | null;
  currentUser: SocialUser | null;
  onUpdate: () => void;
  initialDetail?: ReportDetail | null;
}

interface ReportAttachment {
  data?: string;
  url?: string;
  type?: string;
}

interface ReportView {
  user: {
    name?: string | null;
  };
}

export interface ReportDetail {
  id: string;
  status?: string;
  createdAt?: string | Date;
  operatorName?: string;
  category?: string;
  priority?: string;
  problemDescription?: string;
  attachments?: ReportAttachment[];
  views?: unknown[];
  comments?: unknown[];
  reactions?: unknown[];
  mentionUsers?: unknown[];
}

function toReportDetail(value: unknown): ReportDetail | null {
  if (value && typeof value === "object" && "id" in value) {
    return value as ReportDetail;
  }
  return null;
}

function toCommentItems(value: unknown[] | undefined): CommentItem[] {
  return Array.isArray(value) ? (value as CommentItem[]) : [];
}

function toReactionItems(value: unknown[] | undefined): ReactionItem[] {
  return Array.isArray(value) ? (value as ReactionItem[]) : [];
}

function toSocialUsers(value: unknown[] | undefined, fallback: SocialUser[]): SocialUser[] {
  return Array.isArray(value) ? (value as SocialUser[]) : fallback;
}

function toViews(value: unknown[] | undefined): ReportView[] {
  return Array.isArray(value) ? (value as ReportView[]) : [];
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
  const [fullReport, setFullReport] = React.useState<ReportDetail | null>(null);
  const [loadingSocials, setLoadingSocials] = React.useState(false);
  const [mentionUsers, setMentionUsers] = React.useState<SocialUser[]>(
    () => getCachedMentionUsers() ?? []
  );

  const loadDetail = React.useCallback(async (reportId: string, silent = false) => {
    if (!silent) setLoadingSocials(true);
    try {
      const data = await prefetchReportDetail(reportId);
      const detail = toReportDetail(data);
      if (detail) setFullReport(detail);
    } catch (err) {
      console.error("Failed to load report details", err);
    } finally {
      if (!silent) setLoadingSocials(false);
    }
  }, []);

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

    const cachedDetail = toReportDetail(cached);

    if (cachedDetail) {
      setFullReport(cachedDetail);
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


    void fetchMentionUsers().then((users) => setMentionUsers(users));
  }, [isOpen, report?.id, currentUser, loadDetail, initialDetail]);

  React.useEffect(() => {
    if (isOpen && initialDetail?.id === report?.id) {
      setFullReport(initialDetail ?? null);
      setLoadingSocials(false);
    }
  }, [isOpen, initialDetail, report?.id]);

  const handleSocialChange = React.useCallback(
    (nextComments: CommentItem[], nextReactions: ReactionItem[]) => {
      setFullReport((prev) =>
        prev?.id
          ? {
              ...prev,
              comments: nextComments,
              reactions: nextReactions,
            }
          : prev
      );
      if (report?.id) {
        patchReportDetailSocials(report.id, {
          comments: nextComments,
          reactions: nextReactions,
        });
      }
    },
    [report?.id]
  );

  const handleSocialActivity = React.useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  const displayReport = fullReport?.id ? fullReport : report;

  if (!displayReport?.id) return null;

  const shortId = formatReportDisplayId(
    String(displayReport.id),
    (displayReport as { code?: string | null }).code
  );
  const createdAt = new Date(displayReport.createdAt || Date.now());
  const attachments = displayReport.attachments || [];
  const views = toViews(displayReport.views);
  const comments = toCommentItems(displayReport.comments);
  const reactions = toReactionItems(displayReport.reactions);
  const hasAttachments = attachments.length > 0;
  const hasViews = views.length > 0;

  const openAttachment = (file: ReportAttachment) => {
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
          "md:!w-[min(98vw,110rem)] md:!h-[min(96dvh,1020px)] md:!max-h-[96dvh]",
          "md:rounded-2xl md:border md:border-border md:shadow-2xl md:ring-1 md:ring-border/50"
        )}
      >

        <header className="shrink-0 border-b border-border bg-muted/30 px-4 py-4 md:px-10 md:py-6">
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
                  Reporte {shortId}
                </DialogTitle>
                <StatusBadge status={displayReport.status || "pending"} />
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


          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
            <MetaItem
              icon={UserIcon}
              label="Operador"
              value={displayReport.operatorName || "Operador"}
            />
            <MetaItem
              icon={Tag}
              label="Categoría"
              value={displayReport.category || "Sin categoria"}
            />
            <MetaItem
              icon={AlertCircle}
              label="Prioridad"
              value={displayReport.priority || "Sin prioridad"}
            />
          </div>

          {hasViews && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>
                Visto por{" "}
                <span className="text-foreground/80">
                  {views.map((v) => v.user.name || "Usuario").join(", ")}
                </span>
              </span>
            </div>
          )}
        </header>


        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">

          <section className="flex min-h-0 min-w-0 flex-col border-b border-border md:w-[46%] md:shrink-0 md:border-b-0 md:border-r lg:w-[44%]">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 md:px-8">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Descripción del problema
              </h3>
            </div>

            <ScrollArea className="flex-1 px-4 py-4 md:px-8 md:py-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/95">
                {displayReport.problemDescription || ""}
              </p>

              {hasAttachments && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Adjuntos ({attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {attachments.map((file, idx) => (
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


          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/10 md:min-w-[22rem]">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 md:px-6">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Actividad y comentarios
              </h3>
              {!loadingSocials &&
                (comments.length > 0 ||
                  reactions.length > 0) && (
                  <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
                    {comments.length} comentario
                    {comments.length !== 1 ? "s" : ""}
                  </Badge>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6 md:py-5">
              {loadingSocials &&
              !(toCommentItems(fullReport?.comments).length || toReactionItems(fullReport?.reactions).length) ? (
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
                  initialComments={comments}
                  initialReactions={reactions}
                  availableUsers={toSocialUsers(displayReport.mentionUsers, mentionUsers)}
                  onSocialChange={handleSocialChange}
                  onUpdate={handleSocialActivity}
                />
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
