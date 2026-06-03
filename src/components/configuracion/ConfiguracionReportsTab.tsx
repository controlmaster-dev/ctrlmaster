"use client";

import { Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ReportCleanupRow = {
  id: string;
  createdAt: string | Date;
  operatorName: string;
  problemDescription: string;
};

type ConfiguracionReportsTabProps = {
  reportsReady: boolean;
  reports: ReportCleanupRow[];
  onDeleteReport: (id: string) => void;
};

export function ConfiguracionReportsTab({
  reportsReady,
  reports,
  onDeleteReport,
}: ConfiguracionReportsTabProps) {
  if (!reportsReady) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card shadow-none">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Cargando base de datos de reportes…</p>
      </div>
    );
  }

  return (
    <Card className="rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border bg-muted/10 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              Depuración de Reportes
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground opacity-80">
              Filtre e inspeccione el registro de incidencias del sistema para su depuración o
              auditoría.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID o descripción..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 text-xs font-medium tracking-tight text-foreground focus-visible:ring-1 focus-visible:ring-brand/30"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-xs">
          <TableHeader className="border-b border-border bg-muted/30">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-10 pl-6 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                ID Interno
              </TableHead>
              <TableHead className="h-10 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fecha
              </TableHead>
              <TableHead className="h-10 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Operador
              </TableHead>
              <TableHead className="h-10 w-[40%] text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción del Reporte
              </TableHead>
              <TableHead className="h-10 pr-6 text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {reports.map((report) => (
              <TableRow
                key={report.id}
                className="group border-none transition-all duration-150 hover:bg-muted/10"
              >
                <TableCell className="pl-6 font-mono text-[10px] font-semibold tracking-tight text-primary">
                  #{report.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium tracking-tight text-foreground">
                  {new Date(report.createdAt).toLocaleDateString("es-CR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-medium tracking-tight text-foreground">
                  {report.operatorName}
                </TableCell>
                <TableCell className="max-w-md truncate font-medium text-muted-foreground">
                  {report.problemDescription}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReport(report.id)}
                    className="h-8 w-8 rounded-[2px] text-destructive transition-all hover:bg-destructive/10 hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
