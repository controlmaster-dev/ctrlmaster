"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import { getOperadoresBundle, setOperadoresBundle, setOperadoresWeekCache } from "@/lib/operadoresCache";
import {
  getConfiguracionCache,
  setConfiguracionCache,
} from "@/lib/configuracionCache";
import { getClavesCache, setClavesCache } from "@/lib/clavesCache";
import { prefetchReportDetails } from "@/lib/reportDetailCache";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { prefetchBitcentralNearby } from "@/lib/bitcentralCache";
import {
  getReportesListCache,
  setReportesListCache,
} from "@/lib/reportesListCache";
import { sortOperators } from "@/hooks/useOperadoresBundle";
import type { Report } from "@/types/report";
import type { Operator } from "@/lib/types";
import { UI_CONFIG } from "@/config/constants";

function parseReports(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "reports" in data) {
    const reports = (data as { reports: unknown }).reports;
    return Array.isArray(reports) ? reports : [];
  }
  return [];
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


    const usersPromise: Promise<any[]> =
      needDashboard || needOperadores
        ? fetch("/api/users")
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => (Array.isArray(d) ? d : []))
            .catch(() => [])
        : Promise.resolve([]);


    if (needDashboard || needReportes) {
      Promise.all([
        fetch("/api/bootstrap").then((r) => (r.ok ? r.json() : null)),
        needDashboard
          ? fetch("/api/proxy/whatsapp").then((r) => r.json()).catch(() => null)
          : Promise.resolve(null),
        usersPromise,
      ])
        .then(([boot, waData, usersData]) => {
          if (!boot) return;
          const allReports: Report[] = Array.isArray(boot.reports) ? boot.reports : [];
          const stats = boot.stats ?? { total: 0, pending: 0, resolved: 0 };

          if (needDashboard) {
            const reports = allReports.filter(
              (r) => r.operatorName !== "Monitoreo Automático"
            );
            setDashboardCache({
              reports,
              users: usersData,
              comments: Array.isArray(boot.recentComments) ? boot.recentComments : [],
              whatsappHealth: waData,
              fetchedAt: Date.now(),
            });

            const sorted = [...reports].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const ids = [
              ...sorted.slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT).map((r) => r.id),
              ...sorted
                .filter((r) => r.status === "pending")
                .slice(0, 3)
                .map((r) => r.id),
            ];
            void prefetchReportDetails([...new Set(ids)]);
          }

          if (needReportes) {
            const pageReports = allReports.slice(0, 20);
            setReportesListCache({
              queryKey: reportesQuery,
              reports: pageReports,
              total: stats.total ?? 0,
              totalPages: Math.max(1, Math.ceil((stats.total ?? 0) / 20)),
              globalStats: {
                total: stats.total ?? 0,
                pending: stats.pending ?? 0,
                resolved: stats.resolved ?? 0,
              },
              fetchedAt: Date.now(),
            });
            void prefetchReportDetails(pageReports.map((r) => r.id));
          }
        })
        .catch(() => {});
    }

    if (needOperadores) {
      Promise.all([usersPromise, fetch("/api/special-events").then((r) => r.json())])
        .then(([allData, eventsData]) => {
          const all = Array.isArray(allData) ? allData : [];
          const ops = sortOperators(all);
          const events = Array.isArray(eventsData) ? eventsData : [];
          setOperadoresBundle({
            weekStart,
            operators: ops,
            allUsers: all,
            specialEvents: events,
            fetchedAt: Date.now(),
          });
          setOperadoresWeekCache({
            weekStart,
            operators: ops,
            fetchedAt: Date.now(),
          });
        })
        .catch(() => {});
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

    if (isConfigAdmin(user) && !getConfiguracionCache(weekStart)) {
      Promise.all([
        fetch(`/api/users?weekStart=${weekStart}`).then((r) => r.json()),
        fetch("/api/auth/registration-codes").then((r) => r.json()),
      ])
        .then(([usersData, codesData]) => {
          const users = Array.isArray(usersData) ? usersData : [];
          const securityCodes = Array.isArray(codesData) ? codesData : [];
          setConfiguracionCache({
            weekStart,
            users,
            reports: [],
            securityCodes,
            reportsReady: false,
            fetchedAt: Date.now(),
          });

          fetch("/api/reports?limit=500")
            .then((r) => r.json())
            .then((reportsData) => {
              const cached = getConfiguracionCache(weekStart);
              if (!cached) return;
              setConfiguracionCache({
                ...cached,
                reports: parseReports(reportsData),
                reportsReady: true,
                fetchedAt: Date.now(),
              });
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [user]);

  return null;
}
