"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getConfiguracionCache,
  setConfiguracionCache,
  invalidateConfiguracionCache,
  type SecurityCode,
} from "@/lib/configuracionCache";
import { invalidateOperadoresCache } from "@/lib/operadoresCache";

function parseReports(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "reports" in data) {
    const reports = (data as { reports: unknown }).reports;
    return Array.isArray(reports) ? reports : [];
  }
  return [];
}

export function useConfiguracionBundle(weekStart: string, enabled: boolean) {
  const [users, setUsers] = useState<unknown[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);
  const [securityCodes, setSecurityCodes] = useState<SecurityCode[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const apply = useCallback(
    (bundle: {
      users: unknown[];
      reports: unknown[];
      securityCodes: SecurityCode[];
    }) => {
      setUsers(bundle.users);
      setReports(bundle.reports);
      setSecurityCodes(bundle.securityCodes);
    },
    []
  );

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setIsReady(false);

      try {
        const [usersRes, reportsRes, codesRes] = await Promise.all([
          fetch(`/api/users?weekStart=${weekStart}`),
          fetch("/api/reports?limit=500"),
          fetch("/api/auth/registration-codes"),
        ]);

        const usersData = await usersRes.json();
        const reportsData = await reportsRes.json();
        const codesData = await codesRes.json();

        if (!mountedRef.current) return;

        const nextUsers = Array.isArray(usersData) ? usersData : [];
        const nextReports = parseReports(reportsData);
        const nextCodes: SecurityCode[] = Array.isArray(codesData)
          ? (codesData as SecurityCode[])
          : [];

        apply({ users: nextUsers, reports: nextReports, securityCodes: nextCodes });
        setConfiguracionCache({
          weekStart,
          users: nextUsers,
          reports: nextReports,
          securityCodes: nextCodes,
          fetchedAt: Date.now(),
        });
        setIsReady(true);
      } catch (e) {
        console.error("Configuracion fetch error", e);
        if (!mountedRef.current) return;
        if (!silent) setIsReady(true);
      }
    },
    [weekStart, enabled, apply]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const cached = getConfiguracionCache(weekStart);
    if (cached) {
      apply({
        users: cached.users,
        reports: cached.reports,
        securityCodes: cached.securityCodes,
      });
      setIsReady(true);
      void fetchAll(true);
    } else {
      void fetchAll(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [weekStart, enabled, apply, fetchAll]);

  const refresh = useCallback(() => {
    invalidateConfiguracionCache();
    invalidateOperadoresCache();
    return fetchAll(true);
  }, [fetchAll]);

  return {
    users,
    reports,
    securityCodes,
    setSecurityCodes,
    isReady,
    refresh,
  };
}

export { invalidateConfiguracionCache };
