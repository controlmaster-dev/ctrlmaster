"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Trash2, FileText } from "lucide-react";
import { formatReportDisplayId } from "@/lib/reportCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BentoCard } from "@/components/dashboard/BentoCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ReportCleanupRow = {
  id: string;
  code?: string | null;
  createdAt: string | Date;
  operatorName: string;
  problemDescription: string;
};

type ConfiguracionReportsTabProps = {
  reportsReady: boolean;
  reports: ReportCleanupRow[];
  onDeleteReport: (id: string) => void;
};

function matchesSearch(report: ReportCleanupRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const code = formatReportDisplayId(report.id, report.code).toLowerCase();
  return (
    code.includes(q) ||
    report.operatorName.toLowerCase().includes(q) ||
    report.problemDescription.toLowerCase().includes(q)
  );
}

export function ConfiguracionReportsTab({
  reportsReady,
  reports,
  onDeleteReport,
}: ConfiguracionReportsTabProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => reports.filter((r) => matchesSearch(r, search)),
    [reports, search]
  );

  if (!reportsReady) {
    return (
      <BentoCard className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando reportes…</p>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/80 p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            Depuración de reportes
          </div>
          <p className="max-w-lg text-sm text-muted-foreground">
            Elimine incidencias de prueba o duplicadas. Los cambios se reflejan de inmediato en
            reportes y el panel principal.
          </p>
          <p className="text-xs text-muted-foreground/80">
            {reports.length} en el registro
            {search.trim() ? ` · ${filtered.length} coincidencias` : ""}
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, operador o descripción…"
            className="h-9 border-border/80 bg-background pl-9 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            {search.trim() ? "Sin resultados para esa búsqueda" : "No hay reportes"}
          </p>
          <p className="text-xs text-muted-foreground">
            {search.trim()
              ? "Pruebe otro término o limpie el filtro."
              : "El registro está vacío."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/80 hover:bg-transparent">
                <TableHead className="w-[120px] pl-5 text-xs font-medium text-muted-foreground">
                  Código
                </TableHead>
                <TableHead className="w-[110px] text-xs font-medium text-muted-foreground">
                  Fecha
                </TableHead>
                <TableHead className="w-[140px] text-xs font-medium text-muted-foreground">
                  Operador
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Descripción
                </TableHead>
                <TableHead className="w-[72px] pr-5 text-right text-xs font-medium text-muted-foreground">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report) => (
                <TableRow
                  key={report.id}
                  className="border-border/60 hover:bg-muted/30"
                >
                  <TableCell className="pl-5 font-mono text-xs font-medium text-foreground">
                    {formatReportDisplayId(report.id, report.code)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString("es-CR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {report.operatorName}
                  </TableCell>
                  <TableCell>
                    <p
                      className={cn(
                        "line-clamp-2 max-w-xl text-sm leading-snug text-muted-foreground"
                      )}
                      title={report.problemDescription}
                    >
                      {report.problemDescription}
                    </p>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar reporte"
                      onClick={() => onDeleteReport(report.id)}
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </BentoCard>
  );
}
