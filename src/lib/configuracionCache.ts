const KEY = "cm_configuracion_v1";
const TTL_MS = 5 * 60 * 1000;

export interface SecurityCode {
  id: string;
  code: string;
  status: "available" | "used" | "expired";
  createdAt: string;
  expiresAt: string;
  createdById?: string;
  usedById?: string | null;
}

export interface ConfiguracionBundle {
  weekStart: string;
  users: unknown[];
  reports: unknown[];
  securityCodes: SecurityCode[];
  /** false mientras se carga /api/reports?limit=500 en segundo plano */
  reportsReady?: boolean;
  fetchedAt: number;
}

export function getConfiguracionCache(weekStart: string): ConfiguracionBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConfiguracionBundle;
    if (
      !data?.fetchedAt ||
      data.weekStart !== weekStart ||
      Date.now() - data.fetchedAt > TTL_MS
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setConfiguracionCache(bundle: ConfiguracionBundle) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(bundle));
  } catch {
    // ignore
  }
}

export function invalidateConfiguracionCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
