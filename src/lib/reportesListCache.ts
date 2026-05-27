/** Caché de sesión para la lista de reportes (primera página / filtros por defecto) */

const KEY = "cm_reportes_list_v1";
const TTL_MS = 3 * 60 * 1000;

export interface ReportesListBundle {
  queryKey: string;
  reports: unknown[];
  total: number;
  totalPages: number;
  globalStats: { total: number; pending: number; resolved: number };
  fetchedAt: number;
}

export function getReportesListCache(queryKey: string): ReportesListBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ReportesListBundle;
    if (
      !data?.fetchedAt ||
      data.queryKey !== queryKey ||
      Date.now() - data.fetchedAt > TTL_MS
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setReportesListCache(bundle: ReportesListBundle) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(bundle));
  } catch {
    // ignore
  }
}

export function invalidateReportesListCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
