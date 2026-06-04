import type { Comment } from "@/hooks/useDashboardData";
import type { DashboardBundle } from "@/lib/dashboardCache";
import { EXCLUDE_AUTOMATED_OPERATOR, normalizeReportStats } from "@/lib/reportStats";
import type { Report } from "@/types/report";
import type { User } from "@/types/auth";

type BootstrapPayload = {
  reports?: Report[];
  recentComments?: Comment[];
  stats?: unknown;
  users?: User[];
};

function parseWhatsappHealth(data: unknown): unknown | null {
  return data && typeof data === "object" && "success" in (data as object) ? data : null;
}

function mapUsers(raw: unknown): User[] {
  if (!Array.isArray(raw)) return [];
  return raw as User[];
}

export async function fetchDashboardBundle(): Promise<DashboardBundle | null> {
  try {
    const [bootRes, waData] = await Promise.all([
      fetch("/api/bootstrap", { credentials: "include", cache: "no-store" }),
      fetch("/api/proxy/whatsapp")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (!bootRes.ok) return null;

    const boot = (await bootRes.json()) as BootstrapPayload;
    const reportsList = Array.isArray(boot.reports) ? boot.reports : [];
    const reports = reportsList.filter(
      (r) => r.operatorName !== EXCLUDE_AUTOMATED_OPERATOR
    );

    let users = mapUsers(boot.users);
    if (users.length === 0) {
      const usersRes = await fetch("/api/users", { credentials: "include" });
      if (usersRes.ok) {
        users = mapUsers(await usersRes.json());
      }
    }

    return {
      reports,
      users,
      comments: Array.isArray(boot.recentComments) ? boot.recentComments : [],
      whatsappHealth: parseWhatsappHealth(waData),
      reportStats: normalizeReportStats(boot.stats),
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
