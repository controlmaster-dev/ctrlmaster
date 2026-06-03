"use client";

import {
  FileText,
  CheckCircle2,
  Mail,
  Send,
  MessageSquare,
  ThumbsUp,
  Zap,
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
import { prefetchReportDetail } from "@/lib/reportDetailCache";
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-border bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-4 text-xs font-medium text-muted-foreground">
                  Incidencia
                </TableHead>
                <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                  Categoría
                </TableHead>
                <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                  Actividad
                </TableHead>
                <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                  Prioridad
                </TableHead>
                <TableHead className="h-11 pr-4 text-right text-xs font-medium text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow
                  key={report.id}
                  className="group cursor-pointer border-border transition-colors hover:bg-muted/20"
                  onMouseEnter={() => prefetchReportDetail(report.id)}
                  onClick={() => onRowClick(report)}
                >
                  <TableCell className="py-3.5 pl-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{report.id.slice(0, 6)}
                        </span>
                        <span className="line-clamp-1 text-sm font-medium text-foreground group-hover:underline">
                          {report.problemDescription}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{report.operatorName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-muted-foreground">
                    {report.category}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <ReportesStatusBadge status={report.status} />
                      {report.emailStatus && report.emailStatus !== "none" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {report.emailStatus === "sent"
                            ? "Enviado"
                            : report.emailStatus === "pending"
                              ? "Pendiente"
                              : report.emailStatus === "error"
                                ? "Error"
                                : "No enviado"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      {(report._count?.comments || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs" title="Comentarios">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {report._count?.comments}
                        </span>
                      )}
                      {(report._count?.reactions || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs" title="Reacciones">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {report._count?.reactions}
                        </span>
                      )}
                      {!(report._count?.comments || 0) && !(report._count?.reactions || 0) && (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-muted-foreground">
                    {report.priority}
                  </TableCell>
                  <TableCell className="py-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5 overflow-hidden rounded-md border border-border bg-muted/10 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <TooltipProvider>
                        {report.status !== "resolved" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => onResolve(report.id, e)}
                                className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marcar resuelto</p>
                            </TooltipContent>
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
                              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descargar PDF</p>
                          </TooltipContent>
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
                              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enviar correo</p>
                          </TooltipContent>
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
                              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enviar y descargar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {reports.length === 0 && !loading && (
          <div className="border-t border-border py-16 text-center">
            <Zap className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sin resultados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prueba con otros filtros o crea un reporte nuevo.
            </p>
          </div>
        )}
      </BentoCard>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {reports.length} de {total} reportes (página {page} de {totalPages})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-9 px-3 text-xs"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 w-8 text-xs ${page === pageNum ? "bg-foreground text-background hover:bg-foreground/90" : ""}`}
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
              className="h-9 px-3 text-xs"
            >
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
