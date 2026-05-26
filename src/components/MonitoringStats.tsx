"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Signal, VolumeX, ShieldCheck, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ChannelRow = {
  name: string;
  errors?: number;
  blackScreen?: number;
  silence?: number;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function aggregateChannels(data: ChannelRow[]) {
  let black = 0;
  let silence = 0;
  let errors = 0;
  for (const c of data) {
    black += c.blackScreen || 0;
    silence += c.silence || 0;
    errors += c.errors || 0;
  }
  const totalIssues = black + silence + errors;
  const n = data.length;
  if (n === 0) {
    return {
      blackScreens: 0,
      silenceEvents: 0,
      errorEvents: 0,
      totalIssues: 0,
      health: null as number | null,
      channelCount: 0
    };
  }
  const penalty = Math.min(100, (totalIssues / n) * 4);
  const health = Math.round(Math.max(0, 100 - penalty) * 10) / 10;
  return {
    blackScreens: black,
    silenceEvents: silence,
    errorEvents: errors,
    totalIssues,
    health,
    channelCount: n
  };
}

const MetricCard = React.memo(function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  color,
  accentClass
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  color: string;
  accentClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-0.5 shrink-0 rounded-full ${accentClass}`} />
            <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
          </div>
          <div className="text-3xl font-light tabular-nums tracking-tight text-foreground sm:text-4xl">
            {value}
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">{subtext}</p>
        </div>
        <div className="shrink-0 rounded-md border border-border/50 bg-muted/30 p-2.5">
          <Icon className={`h-4 w-4 ${color} opacity-90`} />
        </div>
      </div>
    </div>
  );
});

const ChannelCard = React.memo(function ChannelCard({ channel }: { channel: ChannelRow }) {
  const black = channel.blackScreen || 0;
  const silence = channel.silence || 0;
  const err = channel.errors || 0;
  const total = black + silence + err;
  const isCritical = total > 50;
  const isWarning = total > 10;

  const statusLabel = isCritical
    ? "Requiere atención"
    : isWarning
      ? "Revisar pronto"
      : "Sin alertas";
  const statusStyles = isCritical
    ? "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300"
    : isWarning
      ? "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/50 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{channel.name}</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusStyles}`}>
          {statusLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-md border border-border/40 bg-muted/20 p-2">
          <div className="text-sm font-medium tabular-nums text-foreground">{black}</div>
          <div className="text-[10px] text-muted-foreground">En negro</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 p-2">
          <div className="text-sm font-medium tabular-nums text-foreground">{silence}</div>
          <div className="text-[10px] text-muted-foreground">Sin audio</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 p-2">
          <div className="text-sm font-medium tabular-nums text-muted-foreground">{err}</div>
          <div className="text-[10px] text-muted-foreground">Otros avisos</div>
        </div>
      </div>
    </div>
  );
});

const POLL_MS = 45000;

export function MonitoringStats() {
  const reducedMotion = usePrefersReducedMotion();
  const [channelStats, setChannelStats] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/streams/stats");
      if (!res.ok) throw new Error("No se pudo cargar el estado de las señales");
      const data = (await res.json()) as ChannelRow[];
      if (!Array.isArray(data)) throw new Error("Respuesta inválida");
      setChannelStats(data);
      setFetchError(null);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setFetchError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const go = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchStats();
    };
    const id = window.setInterval(go, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") fetchStats();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchStats]);

  const agg = useMemo(() => aggregateChannels(channelStats), [channelStats]);

  const healthLabel = useMemo(() => {
    if (loading && channelStats.length === 0) return "…";
    if (agg.health === null) return "Aún no hay datos de las últimas 24 horas.";
    if (agg.totalIssues === 0) return "Sin incidentes registrados";
    if (agg.health >= 90) return "Pocos incidentes; sigue pendiente";
    if (agg.health >= 70) return "Varios incidentes en el periodo";
    return "Revisa los canales marcados en rojo o amarillo";
  }, [loading, channelStats.length, agg.totalIssues, agg.health]);

  const pulse = !reducedMotion ? "animate-pulse" : "";

  return (
    <div className="flex h-[85vh] max-h-[90dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 shrink-0 border-b border-border/60 bg-card/90 px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-medium text-primary ${pulse}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                En tiempo real
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Últimas 24 horas</span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Estado de las <span className="font-medium text-primary">señales</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pantallas en negro, falta de audio y otras alertas detectadas en cada canal.
            </p>
            {fetchError && (
              <p className="text-sm text-destructive" role="alert">
                {fetchError}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="text-xs font-medium text-muted-foreground">Resumen general</p>
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-4xl font-light text-foreground sm:text-5xl">
                {loading && channelStats.length === 0 ? "—" : agg.health === null ? "—" : agg.health}
              </span>
              {agg.health !== null && (!loading || channelStats.length > 0) ? (
                <span className="text-2xl font-medium text-primary/70">%</span>
              ) : null}
            </div>
            <p className="max-w-xs text-right text-xs leading-snug text-muted-foreground sm:text-sm">{healthLabel}</p>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <ShieldCheck className="h-7 w-7 text-primary opacity-90" aria-hidden />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 space-y-10 overflow-y-auto p-5 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Estado general"
            value={loading && channelStats.length === 0 ? "—" : agg.health === null ? "N/D" : `${agg.health}%`}
            subtext="Según lo registrado en 24 h. No confirma si la señal está bien en este momento."
            icon={Zap}
            color="text-primary"
            accentClass="bg-primary"
          />
          <MetricCard
            title="Canales monitoreados"
            value={agg.channelCount}
            subtext={
              agg.channelCount === 0
                ? "Cuando haya registros, aparecerán aquí."
                : "Con al menos un evento en las últimas 24 horas."
            }
            icon={Signal}
            color="text-muted-foreground"
            accentClass="bg-muted-foreground/50"
          />
          <MetricCard
            title="Pantallas en negro"
            value={agg.blackScreens}
            subtext="Veces que se detectó pantalla negra, sumando todos los canales."
            icon={AlertTriangle}
            color="text-red-500"
            accentClass="bg-red-500"
          />
          <MetricCard
            title="Sin audio"
            value={agg.silenceEvents}
            subtext="Veces que se detectó silencio en el mismo periodo."
            icon={VolumeX}
            color="text-amber-600 dark:text-amber-400"
            accentClass="bg-amber-500"
          />
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-foreground">Detalle por canal</h2>
            <p className="text-xs text-muted-foreground">
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}`
                : loading
                  ? "Cargando…"
                  : "Sin datos por ahora"}
              {" · "}
              Se actualiza cada {POLL_MS / 1000} s con esta ventana abierta.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading && channelStats.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-36 rounded-lg border border-border/40"
                  />
                ))
              : channelStats.length === 0
                ? (
                    <div className="col-span-full rounded-lg border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No hay registros en las últimas 24 horas
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cuando el sistema detecte algo en los canales, lo verás aquí.
                      </p>
                    </div>
                  )
                : (
                    channelStats.map((ch) => <ChannelCard key={ch.name} channel={ch} />)
                  )}
          </div>
        </section>
      </div>

      <footer className="relative z-10 shrink-0 border-t border-border/60 bg-card/90 px-5 py-4 text-[11px] text-muted-foreground sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Datos guardados en el sistema. Se actualiza cada {POLL_MS / 1000} s mientras tengas esta ventana abierta.
          </p>
          {lastUpdated ? (
            <p className="text-[10px] tabular-nums opacity-80">
              Última actualización:{" "}
              {lastUpdated.toLocaleString("es-CR", {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
