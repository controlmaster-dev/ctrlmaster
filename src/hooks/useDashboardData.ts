


"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Report } from "@/types/report";
import type { User } from "@/types/auth";
import { UI_CONFIG, STORAGE_KEYS } from "@/config/constants";
import { prefetchReportDetails, invalidateReportDetailCache } from "@/lib/reportDetailCache";
import { prefetchBitcentralNearby } from "@/lib/bitcentralCache";
import {
  getDashboardCache,
  setDashboardCache,
  invalidateDashboardCache,
  type DashboardBundle,
} from "@/lib/dashboardCache";


type RefetchCallback = () => void;
const refetchRegistry = new Map<string, Set<RefetchCallback>>();

export function registerRefetch(key: string, callback: RefetchCallback) {
  if (!refetchRegistry.has(key)) {
    refetchRegistry.set(key, new Set());
  }
  refetchRegistry.get(key)!.add(callback);
}

export function triggerRefetch(key: string) {
  const callbacks = refetchRegistry.get(key);
  if (callbacks) {
    callbacks.forEach(cb => cb());
  }
}

export function unregisterRefetch(key: string, callback: RefetchCallback) {
  const callbacks = refetchRegistry.get(key);
  if (callbacks) {
    callbacks.delete(callback);
  }
}


export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  criticalReports: number;
  reportsToday: number;
  averageResolutionTime: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; image?: string };
  reportId: string;
  report?: { id?: string; problemDescription?: string };
}

function prefetchReportDetailsFromReports(allReports: Report[]) {
  const sorted = [...allReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentIds = sorted.slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT).map((r) => r.id);
  const pendingIds = sorted
    .filter((r) => r.status === "pending")
    .slice(0, 3)
    .map((r) => r.id);
  void prefetchReportDetails([...new Set([...recentIds, ...pendingIds])]);
}

function deriveStats(reports: Report[]): DashboardStats {
  const today = new Date().toDateString();
  return {
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    resolvedReports: reports.filter((r) => r.status === "resolved").length,
    criticalReports: reports.filter(
      (r) =>
        (r.priority === "Enlace" || r.priority === "Todos") && r.status !== "resolved"
    ).length,
    reportsToday: reports.filter(
      (r) => new Date(r.createdAt).toDateString() === today
    ).length,
    averageResolutionTime: 0,
  };
}

function deriveChartData(reports: Report[]): ChartData {
  const days: string[] = [];
  const values: number[] = [];
  for (let i = UI_CONFIG.CHART_DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString("es-CR", { weekday: "short" });
    days.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));
    const dayStr = date.toDateString();
    values.push(
      reports.filter((r) => new Date(r.createdAt).toDateString() === dayStr).length
    );
  }
  return { labels: days, values };
}

function deriveRecentReports(reports: Report[]): Report[] {
  return [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT);
}


export function useDashboardBundle() {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [whatsappHealth, setWhatsappHealth] = useState<unknown | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const applyBundle = useCallback((bundle: DashboardBundle) => {
    setReports(bundle.reports);
    setUsers(bundle.users);
    setComments(bundle.comments ?? []);
    setWhatsappHealth(bundle.whatsappHealth ?? null);
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsReady(false);

    try {
      const [reportsRes, usersRes, commentsRes, waRes] = await Promise.all([
        fetch("/api/reports?limit=50"),
        fetch("/api/users"),
        fetch("/api/comments/recent"),
        fetch("/api/proxy/whatsapp"),
      ]);

      const reportsData = await reportsRes.json();
      const usersData = await usersRes.json();
      const commentsData = await commentsRes.json();
      let waData: unknown = null;
      try {
        waData = await waRes.json();
      } catch {
        waData = null;
      }

      const reportsList: Report[] = Array.isArray(reportsData)
        ? reportsData
        : reportsData.reports || [];
      const allReports = reportsList.filter(
        (r: Report) => r.operatorName !== "Monitoreo Automático"
      );
      const usersList: User[] = Array.isArray(usersData) ? usersData : [];
      const commentsList: Comment[] = Array.isArray(commentsData) ? commentsData : [];
      const wa =
        waData && typeof waData === "object" && "success" in (waData as object)
          ? waData
          : null;

      if (!mountedRef.current) return;

      const bundle: DashboardBundle = {
        reports: allReports,
        users: usersList,
        comments: commentsList,
        whatsappHealth: wa,
        fetchedAt: Date.now(),
      };

      applyBundle(bundle);
      setDashboardCache(bundle);
      setIsReady(true);

      prefetchReportDetailsFromReports(allReports);
      const reportIds = commentsList
        .map((c) => c.reportId || c.report?.id)
        .filter((id): id is string => !!id);
      if (reportIds.length > 0) void prefetchReportDetails(reportIds);
      void prefetchBitcentralNearby();
    } catch {
      if (!mountedRef.current) return;
      if (!silent) setIsReady(true);
    }
  }, [applyBundle]);

  useEffect(() => {
    mountedRef.current = true;
    const cached = getDashboardCache();
    if (cached) {
      applyBundle(cached);
      setIsReady(true);
      prefetchReportDetailsFromReports(cached.reports);
      void prefetchBitcentralNearby();
      void fetchAll(true);
    } else {
      void fetchAll(false);
    }

    const refetch = () => {
      invalidateDashboardCache();
      void fetchAll(true);
    };
    registerRefetch("dashboard", refetch);
    registerRefetch("reports", refetch);

    const waInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      fetch("/api/proxy/whatsapp")
        .then((r) => r.json())
        .then((data) => {
          if (mountedRef.current && data && typeof data === "object") {
            setWhatsappHealth(data);
          }
        })
        .catch(() => {});
    }, 60000);

    return () => {
      mountedRef.current = false;
      unregisterRefetch("dashboard", refetch);
      unregisterRefetch("reports", refetch);
      clearInterval(waInterval);
    };
  }, [applyBundle, fetchAll]);

  const stats = useMemo(() => deriveStats(reports), [reports]);
  const recentReports = useMemo(() => deriveRecentReports(reports), [reports]);
  const chartData = useMemo(() => deriveChartData(reports), [reports]);

  return {
    stats,
    recentReports,
    chartData,
    users,
    comments,
    whatsappHealth,
    isReady,
  };
}

export function useDashboardStats() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(() => {
    if (fetchRef.current) fetchRef.current.abort();
    fetchRef.current = new AbortController();

    setIsLoading(true);
    fetch("/api/reports?limit=50", { signal: fetchRef.current.signal })
      .then((res) => res.json())
      .then((data) => {
        const reportsList: Report[] = Array.isArray(data)
          ? data
          : (data.reports || []);
        const allReports: Report[] = reportsList.filter(
          (r: Report) => r.operatorName !== "Monitoreo Automático"
        );
        setReports(allReports);

        const sorted = [...allReports].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const recentIds = sorted
          .slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT)
          .map((r) => r.id);
        const pendingIds = sorted
          .filter((r) => r.status === "pending")
          .slice(0, 3)
          .map((r) => r.id);
        void prefetchReportDetails([...new Set([...recentIds, ...pendingIds])]);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {

        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    doFetch();
    return () => {
      if (fetchRef.current) fetchRef.current.abort();
    };
  }, [doFetch]);


  useEffect(() => {
    const refetch = () => doFetch();
    registerRefetch('reports', refetch);
    return () => unregisterRefetch('reports', refetch);
  }, [doFetch]);


  const stats = useMemo<DashboardStats>(() => {
    const today = new Date().toDateString();
    return {
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
      resolvedReports: reports.filter((r) => r.status === "resolved").length,
      criticalReports: reports.filter(
        (r) =>
          (r.priority === "Enlace" || r.priority === "Todos") &&
          r.status !== "resolved"
      ).length,
      reportsToday: reports.filter(
        (r) => new Date(r.createdAt).toDateString() === today
      ).length,
      averageResolutionTime: 0,
    };
  }, [reports]);


  const recentReports = useMemo<Report[]>(
    () =>
      [...reports]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, UI_CONFIG.RECENT_REPORTS_LIMIT),
    [reports]
  );


  const chartData = useMemo<ChartData>(() => {
    const days: string[] = [];
    const values: number[] = [];

    for (let i = UI_CONFIG.CHART_DAYS - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);


      const dayName = date.toLocaleDateString("es-CR", { weekday: "short" });
      days.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));


      const dayStr = date.toDateString();
      const count = reports.filter(
        (r) => new Date(r.createdAt).toDateString() === dayStr
      ).length;
      values.push(count);
    }

    return { labels: days, values };
  }, [reports]);

  return { stats, recentReports, chartData, isLoading };
}


export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {

      })
      .finally(() => setIsLoading(false));
  }, []);

  return { users, isLoading };
}


export function useRecentComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/comments/recent")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setComments(data);
          const reportIds = data
            .map((c: Comment) => c.reportId || (c as { report?: { id?: string } }).report?.id)
            .filter((id): id is string => !!id);
          if (reportIds.length > 0) void prefetchReportDetails(reportIds);
        }
      })
      .catch(() => {

      })
      .finally(() => setIsLoading(false));
  }, []);

  return { comments, isLoading };
}


let lastBirthdayToastDate: string | null = null;

export function useBirthdayNotifications(users: User[], isLoadingUsers: boolean) {
  useEffect(() => {
    if (isLoadingUsers || users.length === 0) return;

    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");
    const currentDay = today.getDate().toString().padStart(2, "0");

    const birthdayUsers = users.filter((u) => {
      if (!u.birthday) return false;
      const [m, d] = u.birthday.split("-");
      return m === currentMonth && d === currentDay;
    });

    if (birthdayUsers.length === 0) return;

    const todayStr = today.toDateString();
    if (lastBirthdayToastDate === todayStr) return;


    birthdayUsers.forEach((u) => {
      const firstName = u.name.split(" ")[0];
      toast(`¡Feliz Cumpleaños ${firstName}! 🎂`, {
        description: "Hoy es un día especial para nuestro equipo.",
        duration: UI_CONFIG.TOAST_DURATION,
        action: {
          label: "Celebrar 🎉",
          onClick: () => {},
        },
      });
    });

    lastBirthdayToastDate = todayStr;
  }, [users, isLoadingUsers]);
}

export function useCurrentUser(): User | null {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {

    }
  }, []);

  return currentUser;
}


export function useResolveReport(
  onSuccess: (msg: string) => void,
  onError: (msg: string) => void
) {
  return useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch("/api/reports", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "resolved" }),
          credentials: "include",
        });
        if (res.ok) {
          invalidateReportDetailCache(id);
          invalidateDashboardCache();
          triggerRefetch("dashboard");
          triggerRefetch("reports");
          onSuccess("¡Incidencia resuelta!");
        } else {
          throw new Error("Response not OK");
        }
      } catch {
        onError("Error de conexión.");
      }
    },
    [onSuccess, onError]
  );
}
