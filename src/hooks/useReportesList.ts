"use client";

import { useState, useEffect, useCallback } from "react";
import {
  registerRefetch,
  unregisterRefetch,
} from "@/hooks/useDashboardData";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getReportesListCache,
  setReportesListCache,
  invalidateReportesListCache,
  toReportesListItems,
} from "@/lib/reportesListCache";
import {
  getReportDetailCache,
  prefetchReportDetail,
  prefetchReportDetails,
} from "@/lib/reportDetailCache";
import type {
  Report,
  ReportDetail,
  ReportsResponse,
  OperatorStat,
} from "@/components/reportes/reportes-types";
import { normalizeReportStats, type ReportStatsCounts } from "@/lib/reportStats";
const LIMIT = 20;

export function useReportesList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [operatorStats, setOperatorStats] = useState<OperatorStat[]>([]);
  const [globalStats, setGlobalStats] = useState<ReportStatsCounts>(() =>
    normalizeReportStats(null)
  );
  const [initialLoad, setInitialLoad] = useState(true);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (operatorFilter !== "all") params.set("operator", operatorFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [page, debouncedSearch, statusFilter, priorityFilter, operatorFilter, dateFrom, dateTo]);

  const parseListResponse = useCallback(
    async (res: Response): Promise<{
      ok: boolean;
      reports: Report[];
      total: number;
      totalPages: number;
      stats: ReportStatsCounts;
    }> => {
      const data = (await res.json()) as ReportsResponse | Report[] | { error?: string };

      if (!res.ok) {
        console.error("[reportes] list API error:", data);
        return {
          ok: false,
          reports: [],
          total: 0,
          totalPages: 1,
          stats: normalizeReportStats(null),
        };
      }

      if (Array.isArray(data)) {
        const reports = toReportesListItems(data);
        return {
          ok: true,
          reports,
          total: reports.length,
          totalPages: 1,
          stats: normalizeReportStats(null),
        };
      }

      if (
        data &&
        typeof data === "object" &&
        "reports" in data &&
        Array.isArray((data as ReportsResponse).reports)
      ) {
        const payload = data as ReportsResponse;
        const reports = toReportesListItems(payload.reports!);
        return {
          ok: true,
          reports,
          total: payload.total ?? reports.length,
          totalPages: payload.totalPages ?? 1,
          stats: normalizeReportStats(payload.stats),
        };
      }

      console.error("[reportes] unexpected list payload:", data);
      return {
        ok: false,
        reports: [],
        total: 0,
        totalPages: 1,
        stats: normalizeReportStats(null),
      };
    },
    []
  );

  const fetchReports = useCallback(
    async (opts?: { silent?: boolean }) => {
      const queryKey = buildQuery();
      if (!opts?.silent) setLoading(true);

      try {
        const listRes = await fetch(`/api/reports?${queryKey}`, {
          credentials: "include",
        });
        const parsed = await parseListResponse(listRes);

        if (parsed.ok) {
          setReports(parsed.reports);
          setTotal(parsed.total);
          setTotalPages(parsed.totalPages);
          setGlobalStats(parsed.stats);

          setReportesListCache({
            queryKey,
            reports: parsed.reports,
            total: parsed.total,
            totalPages: parsed.totalPages,
            globalStats: parsed.stats,
            fetchedAt: Date.now(),
          });

          void prefetchReportDetails(parsed.reports.map((r) => r.id));
        } else if (!opts?.silent) {
          console.warn("[reportes] keeping previous list after failed fetch");
        }
      } catch (error) {
        console.error("[reportes] fetch failed:", error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [buildQuery, parseListResponse]
  );

  useEffect(() => {
    const queryKey = buildQuery();
    const cached = getReportesListCache(queryKey);
    const cacheUsable =
      cached &&
      cached.reports.length > 0 &&
      (cached.total === 0 || cached.reports.length <= cached.total);

    if (cacheUsable) {
      setReports(cached.reports);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setGlobalStats(cached.globalStats);
      setLoading(false);
      setInitialLoad(false);
      void prefetchReportDetails(cached.reports.map((r) => r.id));
      void fetchReports({ silent: true });
    } else {
      if (cached && cached.reports.length === 0 && cached.total > 0) {
        invalidateReportesListCache();
      }
      void fetchReports();
    }
  }, [buildQuery, fetchReports]);

  useEffect(() => {
    const refetch = () => void fetchReports({ silent: true });
    registerRefetch("reports", refetch);
    return () => unregisterRefetch("reports", refetch);
  }, [fetchReports]);

  const fetchOperatorStats = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/operator-stats", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { operators?: OperatorStat[] };
      if (Array.isArray(data.operators)) {
        setOperatorStats(data.operators);
      }
    } catch (e) {
      console.error("[reportes] operator stats failed:", e);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setOperatorFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const uniqueOperators = Array.from(
    new Set(reports.map((r) => r.operatorName).filter(Boolean))
  ).sort();

  const hasActiveFilters =
    !!search ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    operatorFilter !== "all" ||
    !!dateFrom ||
    !!dateTo;

  const queryKey = buildQuery();
  const hasListCache =
    typeof window !== "undefined" && !!getReportesListCache(queryKey);

  const filterChip = (active: boolean) =>
    active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  const refreshList = useCallback(() => {
    invalidateReportesListCache();
    void fetchReports({ silent: true });
  }, [fetchReports]);

  const openReportFromUrl = useCallback(
    (
      onOpen: (report: Report | null, detail: ReportDetail | null) => void
    ) => {
      const params = new URLSearchParams(window.location.search);
      const reportId = params.get("reportId");
      if (!reportId) return;

      const cached = getReportDetailCache(reportId);
      if (cached) {
        onOpen(cached as Report, cached as ReportDetail);
      }

      prefetchReportDetail(reportId).then((data) => {
        if (data) onOpen(data as Report, data as ReportDetail);
        window.history.replaceState({}, "", window.location.pathname);
      });
    },
    []
  );

  const openReportRow = useCallback(
    (report: Report, onDetail: (detail: ReportDetail | null) => void) => {
      const cached = getReportDetailCache(report.id);
      if (!cached) {
        prefetchReportDetail(report.id).then((data) => {
          if (data) onDetail(data as ReportDetail);
        });
      }
      return cached as ReportDetail | null;
    },
    []
  );

  return {
    reports,
    loading,
    page,
    setPage,
    total,
    totalPages,
    limit: LIMIT,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    operatorFilter,
    setOperatorFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    operatorStats,
    globalStats,
    initialLoad,
    uniqueOperators,
    hasActiveFilters,
    hasListCache,
    queryKey,
    filterChip,
    fetchOperatorStats,
    clearFilters,
    fetchReports,
    refreshList,
    openReportFromUrl,
    openReportRow,
  };
}
