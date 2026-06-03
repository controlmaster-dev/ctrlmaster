/** Conteos globales de reportes (misma fuente en dashboard, reportes y bootstrap). */

export const EXCLUDE_AUTOMATED_OPERATOR = "Monitoreo Automático";

export type ReportStatsCounts = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  today: number;
  /** Pendientes + en progreso (por atender). */
  active: number;
};

export async function fetchReportStats(): Promise<ReportStatsCounts> {
  const res = await fetch("/api/reports/stats", { credentials: "include" });
  if (!res.ok) return normalizeReportStats(null);
  const data = (await res.json()) as Partial<ReportStatsCounts>;
  return normalizeReportStats(data);
}

export function normalizeReportStats(raw: Partial<ReportStatsCounts> | null | undefined): ReportStatsCounts {
  const pending = raw?.pending ?? 0;
  const inProgress = raw?.inProgress ?? 0;
  const resolved = raw?.resolved ?? 0;
  const total = raw?.total ?? pending + inProgress + resolved;
  return {
    total,
    pending,
    inProgress,
    resolved,
    today: raw?.today ?? 0,
    active: raw?.active ?? pending + inProgress,
  };
}
