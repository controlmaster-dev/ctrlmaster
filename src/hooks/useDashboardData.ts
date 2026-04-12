/**
 * Custom hooks for Dashboard data fetching and state management.
 * Extracts all business logic from DashboardClient.tsx for better separation of concerns.
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { Report } from "@/types/report";
import type { User } from "@/types/auth";
import { UI_CONFIG, STORAGE_KEYS } from "@/config/constants";


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
}


export function useDashboardStats() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        const allReports: Report[] = Array.isArray(data)
          ? data.filter((r: Report) => r.operatorName !== "Monitoreo Automático")
          : [];
        setReports(allReports);
      })
      .catch(() => {
        // Errors handled by error boundary upstream
      })
      .finally(() => setIsLoading(false));
  }, []);

  /** Memoized stats derived from reports */
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

  /** Top 5 most recent reports */
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

  /** Weekly trend chart data (last 7 days) */
  const chartData = useMemo<ChartData>(() => {
    const days: string[] = [];
    const values: number[] = [];

    for (let i = UI_CONFIG.CHART_DAYS - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Format day name in Spanish (e.g., "Lun", "Mar")
      const dayName = date.toLocaleDateString("es-CR", { weekday: "short" });
      days.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));

      // Count reports created on this specific day
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
        // Errors handled by error boundary upstream
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
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {
        // Errors handled by error boundary upstream
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { comments, isLoading };
}


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
    const lastShown = sessionStorage.getItem(STORAGE_KEYS.BIRTHDAY_TOAST_DATE);

    if (lastShown === todayStr) return;

    // Show birthday toast for each user with a birthday today
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

    sessionStorage.setItem(STORAGE_KEYS.BIRTHDAY_TOAST_DATE, todayStr);
  }, [users, isLoadingUsers]);
}


export function useCurrentUser(): User | null {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {
      // Ignore JSON parse errors
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
        });
        if (res.ok) {
          onSuccess("¡Incidencia resuelta!");
          setTimeout(() => window.location.reload(), 1500);
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
