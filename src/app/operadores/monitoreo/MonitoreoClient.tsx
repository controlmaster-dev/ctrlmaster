"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  detectStreamPlaybackIssue,
  streamPlaybackErrorMessage,
} from "@/lib/streamPlaybackSupport";
import dynamic from "next/dynamic";
import { StreamGridTile } from "@/components/StreamGridTile";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";

const VideoJSPlayer = dynamic(
  () =>
    import("@/components/VideoJSPlayer").then((m) => ({
      default: m.VideoJSPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black">
        <Skeleton className="h-10 w-10 rounded-full opacity-40" />
        <Skeleton className="h-2 w-24 opacity-30" />
      </div>
    ),
  }
);

const MonitoringStats = dynamic(
  () =>
    import("@/components/MonitoringStats").then((m) => ({
      default: m.MonitoringStats,
    })),
  { ssr: false, loading: () => <MonitoringStatsSkeleton /> }
);

const STREAMS = [
  {
    title: "Enlace TV",
    url: "https://livecdn.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8",
  },
  {
    title: "EJTV",
    url: "https://livecdn.enlace.plus/ejtv/smil:ejtv-hd.smil/playlist.m3u8",
  },
  {
    title: "Planeta Creación",
    url: "https://livecdn.enlace.plus/planetacreacion/smil:planetacreacion-hd.smil/playlist.m3u8",
  },
  {
    title: "Armando Alducin",
    url: "https://livecdn.enlace.plus/armandoalducin/smil:aatv-hd.smil/playlist.m3u8",
  },
  {
    title: "Mujeres de Fe",
    url: "https://livecdn.enlace.plus/mujeresdefe/smil:mujeresdefe-hd.smil/playlist.m3u8",
  },
] as const;

const clampStreamIndex = (idx: number) =>
  Math.min(Math.max(0, idx), STREAMS.length - 1);

const STREAM_SOUND_STORAGE_KEY = "enlace_stream_sound";

type StreamSoundMap = Record<string, boolean>;

function loadStreamSoundMap(): StreamSoundMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STREAM_SOUND_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as StreamSoundMap) : {};
  } catch {
    return {};
  }
}

function PlayerSkeleton() {
  return (
    <Skeleton className="aspect-video h-full w-full rounded-lg bg-zinc-800" />
  );
}

function MonitoringStatsSkeleton() {
  return (
    <div className="flex h-[85vh] max-h-[90dvh] flex-col overflow-hidden bg-background text-foreground">
      <div className="shrink-0 border-b border-border/60 bg-card/90 px-5 py-6 sm:px-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-full" />
          </div>
          <Skeleton className="h-10 w-[60%] rounded-md" />
          <Skeleton className="h-4 w-[72%] rounded-md" />
          <div className="flex flex-wrap items-end gap-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-5 w-52 rounded-md" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 space-y-6 overflow-y-auto p-5 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-card p-4"
            >
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="mt-3 h-12 w-24 rounded-md" />
              <Skeleton className="mt-3 h-3 w-44 rounded-md" />
              <Skeleton className="mt-3 h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-card/50 p-4"
            >
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="mt-3 h-20 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MonitoreoClient() {
  const playbackIssue = useMemo(() => detectStreamPlaybackIssue(), []);
  const [currentTime, setCurrentTime] = useState("");
  const [pvwIndex, setPvwIndex] = useState(0);
  const [prgIndex, setPrgIndex] = useState(1);
  const [statsOpen, setStatsOpen] = useState(false);
  const [playersReady, setPlayersReady] = useState(false);
  const [soundByTitle, setSoundByTitle] = useState<StreamSoundMap>({});

  const pvwStream = useMemo(() => STREAMS[pvwIndex], [pvwIndex]);
  const prgStream = useMemo(() => STREAMS[prgIndex], [prgIndex]);

  useEffect(() => {
    const savedPvw = localStorage.getItem("enlace_pvw_index");
    const savedPrg = localStorage.getItem("enlace_prg_index");
    if (savedPvw !== null) setPvwIndex(clampStreamIndex(parseInt(savedPvw, 10)));
    if (savedPrg !== null) setPrgIndex(clampStreamIndex(parseInt(savedPrg, 10)));
    setSoundByTitle(loadStreamSoundMap());
  }, []);

  useEffect(() => {
    localStorage.setItem("enlace_pvw_index", pvwIndex.toString());
    localStorage.setItem("enlace_prg_index", prgIndex.toString());
  }, [pvwIndex, prgIndex]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPlayersReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      if (!isPageVisible()) return;
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-CR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const onVis = () => updateTime();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const handleCut = useCallback(() => {
    setPvwIndex(prgIndex);
    setPrgIndex(pvwIndex);
  }, [pvwIndex, prgIndex]);

  const handleSelectPreview = useCallback(
    (idx: number) => {
      if (idx !== prgIndex) setPvwIndex(idx);
    },
    [prgIndex]
  );

  const setStreamSound = useCallback((title: string, enabled: boolean) => {
    setSoundByTitle((prev) => {
      const next = { ...prev, [title]: enabled };
      localStorage.setItem(STREAM_SOUND_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleCut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCut]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-y-auto bg-background pt-14 text-foreground md:pt-0">
      <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-card">
        <div className="h-0.5 bg-brand" aria-hidden />

        <div className="flex h-14 items-stretch">
          <div className="flex shrink-0 items-center gap-2 border-r border-border px-3 md:px-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="hidden text-sm font-semibold tracking-tight text-foreground sm:block">
              Monitoreo de canales
            </h1>
          </div>

          <div className="flex min-w-0 flex-1 divide-x divide-border">
            <div className="flex min-w-0 flex-1 items-center gap-3 border-l-[3px] border-l-green-500 bg-green-500/[0.05] px-3 md:px-5">
              <span className="shrink-0 text-xs font-medium text-green-700 dark:text-green-400">
                Vista previa
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {pvwStream?.title}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 border-l-[3px] border-l-red-500 bg-red-500/[0.05] px-3 md:px-5">
              <span className="shrink-0 text-xs font-medium text-red-700 dark:text-red-400">
                Al aire
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {prgStream?.title}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-l border-border px-3 md:gap-4 md:px-4">
            <time
              className="font-mono text-xs font-medium tabular-nums text-foreground md:text-base"
              dateTime={currentTime}
            >
              {currentTime || "00:00:00"}
            </time>
            <p className="hidden text-xs text-muted-foreground xl:block">
              <kbd className="mr-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
                Espacio
              </kbd>
              para cambiar
            </p>
            <ThemeToggle />
            <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground rounded-[6px]"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden md:inline">Ver señales</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl overflow-hidden rounded-[6px] border border-border bg-card p-0 text-card-foreground shadow-none ring-1 ring-border">
                <DialogTitle className="sr-only">Estado de las señales</DialogTitle>
                {statsOpen ? <MonitoringStats /> : null}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {playbackIssue !== "none" && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-[6px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        >
          {streamPlaybackErrorMessage(playbackIssue)}
        </div>
      )}

      <div className="grid shrink-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <div
          className="group/master relative aspect-video cursor-pointer overflow-hidden rounded-[6px] border border-emerald-500/30 bg-black hover:border-emerald-500/50 transition-all duration-200"
          onClick={handleCut}
          title="Clic o barra espaciadora para cambiar de canal"
        >
          {playersReady ? (
            <VideoJSPlayer
              title={pvwStream.title}
              url={pvwStream.url}
              variant="preview"
              active
              soundEnabled={!!soundByTitle[pvwStream.title]}
              onSoundEnabledChange={(enabled) =>
                setStreamSound(pvwStream.title, enabled)
              }
            />
          ) : (
            <PlayerSkeleton />
          )}
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <span className="rounded-full border border-emerald-500/30 bg-background/95 px-4 py-1.5 text-[10px] font-semibold text-emerald-700 opacity-0 shadow-sm group-hover/master:opacity-100 dark:bg-popover/95 dark:text-emerald-400">
              Clic para cambiar
            </span>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-[6px] border-2 border-red-500 bg-black shadow-none">
          {playersReady ? (
            <VideoJSPlayer
              title={prgStream.title}
              url={prgStream.url}
              variant="program"
              active
              soundEnabled={!!soundByTitle[prgStream.title]}
              onSoundEnabledChange={(enabled) =>
                setStreamSound(prgStream.title, enabled)
              }
            />
          ) : (
            <PlayerSkeleton />
          )}
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 bg-background px-3 pb-3 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STREAMS.map((stream, i) => (
          <StreamGridTile
            key={stream.title}
            title={stream.title}
            isPreview={i === pvwIndex}
            isOnAir={i === prgIndex}
            onSelect={() => handleSelectPreview(i)}
          />
        ))}
      </div>
    </div>
  );
}

function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}
