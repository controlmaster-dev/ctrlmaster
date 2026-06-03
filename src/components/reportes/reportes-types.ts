import type { ReportesListItem } from "@/lib/reportesListCache";
import { formatReportDisplayId } from "@/lib/reportCode";

export type Report = ReportesListItem;

export interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface ReportDetail extends Report {
  attachments?: Array<{ data?: string; url?: string }>;
  comments?: unknown[];
  reactions?: unknown[];
  views?: unknown[];
}

export interface OperatorStat {
  name: string;
  total: number;
  pending: number;
  resolved: number;
  emailSent: number;
}

export interface ReportsResponse {
  reports?: Report[];
  total?: number;
  totalPages?: number;
}

export function isReportsResponse(
  value: ReportsResponse | Report[]
): value is ReportsResponse & { reports: Report[] } {
  return !Array.isArray(value) && Array.isArray(value.reports);
}

export function exportReportsToCSV(reports: Report[]) {
  const headers = [
    "ID",
    "Operador",
    "Email",
    "Descripción",
    "Categoría",
    "Prioridad",
    "Estado",
    "Fecha Inicio",
    "Fecha Resolución",
    "Email Enviado",
  ];
  const rows = reports.map((r) => [
    formatReportDisplayId(r.id, r.code),
    r.operatorName,
    r.operatorEmail,
    `"${r.problemDescription.replace(/"/g, '""')}"`,
    r.category,
    r.priority,
    r.status,
    new Date(r.dateStarted).toLocaleString("es-CR"),
    r.dateResolved ? new Date(r.dateResolved).toLocaleString("es-CR") : "Pendiente",
    r.emailStatus === "sent" ? "Sí" : "No",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reportes-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
