"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import { fetchDashboardBundle } from "@/lib/fetchDashboardBundle";
import { getOperadoresBundle, setOperadoresBundle, setOperadoresWeekCache } from "@/lib/operadoresCache";
import { getClavesCache, setClavesCache } from "@/lib/clavesCache";
import { prefetchReportDetails } from "@/lib/reportDetailCache";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getConfiguracionCache } from "@/lib/configuracionCache";
import { prefetchConfiguracionAdmin } from "@/lib/fetchConfiguracionBundle";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { prefetchBitcentralNearby } from "@/lib/bitcentralCache";
import {
  getReportesListCache,
  setReportesListCache,
  toReportesListItems,
} from "@/lib/reportesListCache";
import { fetchOperadoresBundle } from "@/lib/fetchOperadoresBundle";
import type { Report } from "@/types/report";
import { UI_CONFIG } from "@/config/constants";
import { normalizeReportStats } from "@/lib/reportStats";

function prefetchFromReports(reports: Report[]) {
  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const ids = [
    ...sorted.slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT).map((r) => r.id),
    ...sorted.filter((r) => r.status === "pending").slice(0, 3).map((r) => r.id),
  ];
  void prefetchReportDetails([...new Set(ids)]);
}

export function AppDataPrefetch() {
  const { user } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;

    const weekStart = getSundayWeekStart();
    const reportesQuery = "page=1&limit=20";

    const needDashboard = !getDashboardCache();
    const needOperadores = !getOperadoresBundle(weekStart);
    const needReportes = !getReportesListCache(reportesQuery);

    if (needDashboard || needReportes) {
      void fetchDashboardBundle().then((bundle) => {
        if (!bundle) return;
        const stats = normalizeReportStats(bundle.reportStats);

        if (needDashboard) {
          setDashboardCache(bundle);
          prefetchFromReports(bundle.reports);
        }

        if (needReportes) {
          const pageReports = bundle.reports.slice(0, 20);
          setReportesListCache({
            queryKey: reportesQuery,
            reports: toReportesListItems(pageReports),
            total: stats.total ?? 0,
            totalPages: Math.max(1, Math.ceil((stats.total ?? 0) / 20)),
            globalStats: stats,
            fetchedAt: Date.now(),
          });
          void prefetchReportDetails(pageReports.map((r) => r.id));
        }
      });
    }

    if (
      isConfigAdmin(user) &&
      (!getConfiguracionCache(weekStart) || needOperadores)
    ) {
      void prefetchConfiguracionAdmin(weekStart);
    } else if (needOperadores) {
      void fetchOperadoresBundle(weekStart).then((bundle) => {
        if (!bundle) return;
        setOperadoresBundle(bundle);
        setOperadoresWeekCache({
          weekStart: bundle.weekStart,
          operators: bundle.operators,
          fetchedAt: bundle.fetchedAt,
        });
      });
    }

    void prefetchBitcentralNearby();

    if (!getClavesCache()) {
      fetch("/api/credentials")
        .then((r) => r.json())
        .then((data) => {
          setClavesCache({
            credentials: Array.isArray(data) ? data : [],
            fetchedAt: Date.now(),
          });
        })
        .catch(() => {});
    }
  }, [user]);

  return null;
}
