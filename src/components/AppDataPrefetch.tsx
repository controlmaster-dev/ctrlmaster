"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import { getOperadoresBundle, setOperadoresBundle, setOperadoresWeekCache } from "@/lib/operadoresCache";
import {
  getConfiguracionCache,
  setConfiguracionCache,
} from "@/lib/configuracionCache";
import { prefetchReportDetails } from "@/lib/reportDetailCache";
import { isConfigAdmin } from "@/lib/adminAccess";
import { getSundayWeekStart } from "@/lib/weekUtils";
import { prefetchBitcentralNearby } from "@/lib/bitcentralCache";
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

/** Precalienta datos de inicio, operadores y configuración en segundo plano */
export function AppDataPrefetch() {
  const { user } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;

    const weekStart = getSundayWeekStart();

    if (!getDashboardCache()) {
      Promise.all([
        fetch("/api/reports?limit=50").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
        fetch("/api/comments/recent").then((r) => r.json()),
        fetch("/api/proxy/whatsapp")
          .then((r) => r.json())
          .catch(() => null),
      ])
        .then(([reportsData, usersData, commentsData, waData]) => {
          const reportsList: Report[] = Array.isArray(reportsData)
            ? reportsData
            : reportsData.reports || [];
          const reports = reportsList.filter(
            (r) => r.operatorName !== "Monitoreo Automático"
          );

          setDashboardCache({
            reports,
            users: Array.isArray(usersData) ? usersData : [],
            comments: Array.isArray(commentsData) ? commentsData : [],
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
        })
        .catch(() => {});
    }

    if (!getOperadoresBundle(weekStart)) {
      Promise.all([
        fetch(`/api/users?weekStart=${weekStart}`, { cache: "no-store" }).then((r) =>
          r.json()
        ),
        fetch("/api/users").then((r) => r.json()),
        fetch("/api/special-events").then((r) => r.json()),
      ])
        .then(([weekData, allData, eventsData]) => {
          const ops = sortOperators(Array.isArray(weekData) ? weekData : []);
          const all = Array.isArray(allData) ? allData : [];
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

    if (isConfigAdmin(user) && !getConfiguracionCache(weekStart)) {
      Promise.all([
        fetch(`/api/users?weekStart=${weekStart}`).then((r) => r.json()),
        fetch("/api/reports?limit=500").then((r) => r.json()),
        fetch("/api/auth/registration-codes").then((r) => r.json()),
      ])
        .then(([usersData, reportsData, codesData]) => {
          setConfiguracionCache({
            weekStart,
            users: Array.isArray(usersData) ? usersData : [],
            reports: parseReports(reportsData),
            securityCodes: Array.isArray(codesData) ? codesData : [],
            fetchedAt: Date.now(),
          });
        })
        .catch(() => {});
    }
  }, [user]);

  return null;
}
