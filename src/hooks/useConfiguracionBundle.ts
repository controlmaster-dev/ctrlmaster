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
  const [reportsReady, setReportsReady] = useState(false);
  const mountedRef = useRef(true);
  const reportsRef = useRef<unknown[]>([]);
  const reportsReadyRef = useRef(false);

  useEffect(() => {
    reportsRef.current = reports;
    reportsReadyRef.current = reportsReady;
  }, [reports, reportsReady]);

  const apply = useCallback(
    (bundle: {
      users: unknown[];
      reports: unknown[];
      securityCodes: SecurityCode[];
      reportsReady: boolean;
    }) => {
      setUsers(bundle.users);
      setReports(bundle.reports);
      setSecurityCodes(bundle.securityCodes);
      setReportsReady(bundle.reportsReady);
    },
    []
  );

  const persist = useCallback(
    (bundle: {
      users: unknown[];
      reports: unknown[];
      securityCodes: SecurityCode[];
      reportsReady: boolean;
    }) => {
      setConfiguracionCache({
        weekStart,
        users: bundle.users,
        reports: bundle.reports,
        securityCodes: bundle.securityCodes,
        reportsReady: bundle.reportsReady,
        fetchedAt: Date.now(),
      });
    },
    [weekStart]
  );

  const fetchReports = useCallback(
    async (base: {
      users: unknown[];
      securityCodes: SecurityCode[];
    }) => {
      try {
        const reportsRes = await fetch("/api/reports?limit=500");
        const reportsData = await reportsRes.json();
        if (!mountedRef.current) return;

        const nextReports = parseReports(reportsData);
        const next = {
          users: base.users,
          reports: nextReports,
          securityCodes: base.securityCodes,
          reportsReady: true,
        };
        apply(next);
        persist(next);
      } catch (e) {
        console.error("Configuracion reports fetch error", e);
        if (!mountedRef.current) return;
        setReportsReady(true);
      }
    },
    [apply, persist]
  );

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) {
        setIsReady(false);
        setReportsReady(false);
      }

      try {
        const [usersRes, codesRes] = await Promise.all([
          fetch(`/api/users?weekStart=${weekStart}`),
          fetch("/api/auth/registration-codes"),
        ]);

        const usersData = await usersRes.json();
        const codesData = await codesRes.json();

        if (!mountedRef.current) return;

        const nextUsers = Array.isArray(usersData) ? usersData : [];
        const nextCodes: SecurityCode[] = Array.isArray(codesData)
          ? (codesData as SecurityCode[])
          : [];

        const core = {
          users: nextUsers,
          reports: silent ? reportsRef.current : [],
          securityCodes: nextCodes,
          reportsReady: silent ? reportsReadyRef.current : false,
        };

        apply(core);
        persist(core);
        setIsReady(true);

        if (!silent || !reportsReadyRef.current) {
          void fetchReports({ users: nextUsers, securityCodes: nextCodes });
        }
      } catch (e) {
        console.error("Configuracion fetch error", e);
        if (!mountedRef.current) return;
        if (!silent) setIsReady(true);
      }
    },
    [weekStart, enabled, apply, persist, fetchReports]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setIsReady(false);
      setReportsReady(false);
      return;
    }

    const cached = getConfiguracionCache(weekStart);
    if (cached) {
      const ready =
        cached.reportsReady !== false ||
        (Array.isArray(cached.reports) && cached.reports.length > 0);
      apply({
        users: cached.users,
        reports: cached.reports,
        securityCodes: cached.securityCodes,
        reportsReady: ready,
      });
      setIsReady(true);
      if (!ready) {
        void fetchReports({
          users: cached.users,
          securityCodes: cached.securityCodes,
        });
      } else {
        void fetchAll(true);
      }
    } else {
      void fetchAll(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [weekStart, enabled, apply, fetchAll, fetchReports]);

  const refresh = useCallback(() => {
    invalidateConfiguracionCache();
    invalidateOperadoresCache();
    return fetchAll(true);
  }, [fetchAll]);

  return {
    users,
    reports,
    securityCodes,
    isReady,
    reportsReady,
    refresh,
  };
}

export { invalidateConfiguracionCache };
