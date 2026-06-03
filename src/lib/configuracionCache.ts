import { createClientCache } from "@/lib/clientCache";

const TTL_MS = 5 * 60 * 1000;
const store = createClientCache<ConfiguracionBundle>(TTL_MS);

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
  reportsReady?: boolean;
  fetchedAt: number;
}

export function getConfiguracionCache(weekStart: string): ConfiguracionBundle | null {
  const data = store.get();
  if (!data || data.weekStart !== weekStart) return null;
  return data;
}

export function setConfiguracionCache(bundle: ConfiguracionBundle) {
  store.set(bundle);
}

export function invalidateConfiguracionCache() {
  store.invalidate();
}
