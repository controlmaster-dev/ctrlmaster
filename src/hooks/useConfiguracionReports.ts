"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { ReportCleanupRow } from "@/components/configuracion/ConfiguracionReportsTab";

type DebugResponse = {
  reports?: ReportCleanupRow[];
  total?: number;
};

export function useConfiguracionReports(enabled: boolean) {
  const [reports, setReports] = useState<ReportCleanupRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(true);

  const fetchReports = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) return;
      if (!opts?.silent && !ready) setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "100");
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        const res = await fetch(`/api/configuracion/reports-debug?${params}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as DebugResponse;
        if (!mountedRef.current) return;
        setReports(Array.isArray(data.reports) ? data.reports : []);
        setTotal(data.total ?? 0);
        setReady(true);
      } catch (e) {
        console.error("[configuracion] reports-debug failed", e);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [enabled, debouncedSearch, ready]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setReady(false);
      setReports([]);
      return;
    }
    void fetchReports();
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchReports]);

  const removeReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return {
    reports,
    total,
    search,
    setSearch,
    loading,
    ready,
    removeReport,
    reload: () => fetchReports({ silent: true }),
  };
}
