/** Caché de sesión del dashboard — pinta la página al instante en visitas repetidas */

import type { Report } from "@/types/report";
import type { User } from "@/types/auth";
import type { Comment } from "@/hooks/useDashboardData";

const KEY = "cm_dashboard_bundle_v1";
const TTL_MS = 5 * 60 * 1000;

export interface DashboardBundle {
  reports: Report[];
  users: User[];
  comments: Comment[];
  whatsappHealth: unknown | null;
  fetchedAt: number;
}

export function getDashboardCache(): DashboardBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DashboardBundle;
    if (!data?.fetchedAt || Date.now() - data.fetchedAt > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    if (!Array.isArray(data.reports) || !Array.isArray(data.users)) return null;
    return data;
  } catch {
    return null;
  }
}

export function setDashboardCache(bundle: DashboardBundle) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(bundle));
  } catch {
    // quota exceeded — ignore
  }
}

export function invalidateDashboardCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
