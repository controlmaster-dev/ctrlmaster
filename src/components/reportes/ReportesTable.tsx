"use client";

import {
  FileText,
  CheckCircle2,
  Mail,
  Send,
  MessageSquare,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { ReportesStatusBadge } from "@/components/reportes/ReportesStatusBadge";
import { splitCategoryLabels } from "@/components/reportes/reportTableUi";
import { prefetchReportDetail } from "@/lib/reportDetailCache";
import { formatReportDisplayId } from "@/lib/reportCode";
import { cn } from "@/lib/utils";
import type { Report } from "@/components/reportes/reportes-types";

type ReportesTableProps = {
  reports: Report[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (report: Report) => void;
  onResolve: (id: string, e: React.MouseEvent) => void;
  onAction: (report: Report, type: "email" | "both" | "download") => void;
};

function emailStatusLabel(status: string): string | null {
  if (status === "sent") return "Correo enviado";
  if (status === "pending") return "Correo pendiente";
  if (status === "failed" || status === "error") return "Error de correo";
  return null;
}

function ReportRowActions({
  report,
  onResolve,
  onAction,
  className,
}: {
  report: Report;
  onResolve: (id: string, e: React.MouseEvent) => void;
  onAction: (report: Report, type: "email" | "both" | "download") => void;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex shrink-0 items-center gap-0.5 text-muted-foreground", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {report.status !== "resolved" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => onResolve(report.id, e)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Marcar resuelto</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(report, "download");
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Descargar PDF</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(report, "email");
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Enviar correo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(report, "both");
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Enviar y descargar</TooltipContent>
      </Tooltip>
    </div>
  );
}

function getReportRowMeta(report: Report) {
  const code = formatReportDisplayId(report.id, report.code);
  const categories = splitCategoryLabels(report.category);
  const categoryText = categories.length > 0 ? categories.join(" · ") : report.category;
  const commentCount = report._count?.comments ?? 0;
  const reactionCount = report._count?.reactions ?? 0;
  const emailLine = report.emailStatus ? emailStatusLabel(report.emailStatus) : null;
  return { code, categoryText, commentCount, reactionCount, emailLine };
}

function ReportesMobileList({
  reports,
  onRowClick,
  onResolve,
  onAction,
}: Pick<ReportesTableProps, "reports" | "onRowClick" | "onResolve" | "onAction">) {
  return (
    <TooltipProvider delayDuration={300}>
      <ul className="divide-y divide-border/60 md:hidden">
        {reports.map((report) => {
          const { code, categoryText, commentCount, reactionCount, emailLine } =
            getReportRowMeta(report);

          return (
            <li key={report.id}>
              <button
                type="button"
                className="w-full px-4 py-4 text-left transition-colors hover:bg-muted/25 active:bg-muted/40"
                onMouseEnter={() => prefetchReportDetail(report.id)}
                onClick={() => onRowClick(report)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono tabular-nums text-foreground/80">{code}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">{report.operatorName}</span>
                    </div>
                    <p className="text-sm leading-snug text-foreground">
                      {report.problemDescription}
                    </p>
                  </div>
                  <ReportRowActions
                    report={report}
                    onResolve={onResolve}
                    onAction={onAction}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ReportesStatusBadge status={report.status} />
                  {emailLine && (
                    <span className="text-[11px] text-muted-foreground">{emailLine}</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-border/80 bg-muted/25 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {categoryText}
                  </span>
                  <span className="rounded-md border border-border/80 bg-muted/25 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {report.priority}
                  </span>
                  {(commentCount > 0 || reactionCount > 0) && (
                    <span className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-muted/25 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {commentCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {commentCount}
                        </span>
                      )}
                      {reactionCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {reactionCount}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

export function ReportesTable({
  reports,
  loading,
  page,
  total,
  totalPages,
  onPageChange,
  onRowClick,
  onResolve,
  onAction,
}: ReportesTableProps) {
  return (
    <>
      <BentoCard variant="default" className="overflow-hidden">
        <ReportesMobileList
          reports={reports}
          onRowClick={onRowClick}
          onResolve={onResolve}
          onAction={onAction}
        />

        <div className="hidden md:block">
          <TooltipProvider delayDuration={300}>
            <div className="overflow-x-auto">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="h-11 min-w-[280px] pl-4 text-xs font-medium text-muted-foreground">
                      Incidencia
                    </TableHead>
                    <TableHead className="h-11 min-w-[120px] text-xs font-medium text-muted-foreground">
                      Categoría
                    </TableHead>
                    <TableHead className="h-11 min-w-[130px] text-xs font-medium text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="h-11 min-w-[88px] text-xs font-medium text-muted-foreground">
                      Actividad
                    </TableHead>
                    <TableHead className="h-11 min-w-[100px] text-xs font-medium text-muted-foreground">
                      Canal
                    </TableHead>
                    <TableHead className="h-11 min-w-[152px] pr-4 text-right text-xs font-medium text-muted-foreground">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const { code, categoryText, commentCount, reactionCount, emailLine } =
                      getReportRowMeta(report);

                    return (
                      <TableRow
                        key={report.id}
                        className="group cursor-pointer border-border/60 hover:bg-muted/25"
                        onMouseEnter={() => prefetchReportDetail(report.id)}
                        onClick={() => onRowClick(report)}
                      >
                        <TableCell className="py-3.5 pl-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {code}
                              </span>
                              <span className="text-[11px] text-muted-foreground/80">·</span>
                              <span className="truncate text-[11px] text-muted-foreground">
                                {report.operatorName}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-foreground">
                              {report.problemDescription}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-muted-foreground">
                          <span className="line-clamp-2 leading-snug">{categoryText}</span>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <ReportesStatusBadge status={report.status} />
                            {emailLine && (
                              <p className="text-[11px] text-muted-foreground">{emailLine}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-xs text-muted-foreground">
                          {commentCount > 0 || reactionCount > 0 ? (
                            <span className="inline-flex items-center gap-3 tabular-nums">
                              {commentCount > 0 && (
                                <span className="inline-flex items-center gap-1" title="Comentarios">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  {commentCount}
                                </span>
                              )}
                              {reactionCount > 0 && (
                                <span className="inline-flex items-center gap-1" title="Reacciones">
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  {reactionCount}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-muted-foreground">
                          <span className="line-clamp-2 leading-snug">{report.priority}</span>
                        </TableCell>
                        <TableCell className="py-3.5 pr-4 text-right">
                          <ReportRowActions
                            report={report}
                            onResolve={onResolve}
                            onAction={onAction}
                            className="justify-end"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </div>

        {reports.length === 0 && !loading && (
          <div className="border-t border-border py-14 text-center">
            <p className="text-sm text-muted-foreground">No hay reportes con estos filtros.</p>
          </div>
        )}
      </BentoCard>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {reports.length} de {total} reportes · página {page} de {totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="h-8 min-w-8 px-2 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-8 px-2.5 text-xs"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
