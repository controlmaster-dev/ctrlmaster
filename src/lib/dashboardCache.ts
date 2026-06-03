import type { Comment } from "@/hooks/useDashboardData";
import type { User } from "@/types/auth";
import type { Report } from "@/types/report";
import { createClientCache } from "@/lib/clientCache";

const TTL_MS = 5 * 60 * 1000;
const store = createClientCache<DashboardBundle>(TTL_MS);

export interface DashboardBundle {
  reports: Report[];
  users: User[];
  comments: Comment[];
  whatsappHealth: unknown;
  fetchedAt: number;
}

export function getDashboardCache(): DashboardBundle | null {
  const data = store.get();
  if (!data) return null;
  if (!Array.isArray(data.reports) || !Array.isArray(data.users)) return null;
  return data;
}

export function setDashboardCache(bundle: DashboardBundle) {
  store.set(bundle);
}

export function invalidateDashboardCache() {
  store.invalidate();
}
