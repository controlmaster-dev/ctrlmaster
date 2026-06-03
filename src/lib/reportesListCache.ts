import { createClientCache } from "@/lib/clientCache";
import type { ReportStatsCounts } from "@/lib/reportStats";

const TTL_MS = 3 * 60 * 1000;
const store = createClientCache<ReportesListBundle>(TTL_MS);

export interface ReportesListItem {
  id: string;
  code?: string | null;
  problemDescription: string;
  operatorName: string;
  operatorEmail: string;
  category: string;
  status: string;
  priority: string;
  dateStarted: string;
  dateResolved?: string | null;
  createdAt: string;
  emailStatus?: string;
  _count?: { comments: number; reactions: number };
}

export interface ReportesListBundle {
  queryKey: string;
  reports: ReportesListItem[];
  total: number;
  totalPages: number;
  globalStats: ReportStatsCounts;
  fetchedAt: number;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return value != null ? String(value) : "";
}

export function toReportesListItem(
  r: ReportesListItem | { id: string; dateStarted: unknown; dateResolved?: unknown; createdAt: unknown } & Omit<
    ReportesListItem,
    "dateStarted" | "dateResolved" | "createdAt"
  >
): ReportesListItem {
  return {
    ...r,
    dateStarted: toIso(r.dateStarted),
    dateResolved: r.dateResolved != null ? toIso(r.dateResolved) : null,
    createdAt: toIso(r.createdAt),
  };
}

export function toReportesListItems(
  reports: Parameters<typeof toReportesListItem>[0][]
): ReportesListItem[] {
  return reports.map(toReportesListItem);
}

export function getReportesListCache(queryKey: string): ReportesListBundle | null {
  const data = store.get();
  if (!data || data.queryKey !== queryKey) return null;
  return data;
}

export function setReportesListCache(bundle: ReportesListBundle) {
  store.set(bundle);
}

export function invalidateReportesListCache() {
  store.invalidate();
}
