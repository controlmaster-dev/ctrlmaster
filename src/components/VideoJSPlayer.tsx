"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  detectStreamPlaybackIssue,
  isVideoDecodeError,
  streamPlaybackErrorMessage,
  type StreamPlaybackIssue,
} from "@/lib/streamPlaybackSupport";

const METER_SEGMENTS = 12;
const METER_TICK_MS = 300;
const BLACK_SCREEN_INTERVAL_MS = 15000;
const METRIC_THROTTLE_MS = 60000;

interface VideoJSPlayerProps {
  url: string;
  title: string;
  variant?: "default" | "program" | "preview";
  channelLabel?: string;

  active?: boolean;
  soundEnabled?: boolean;
  onSoundEnabledChange?: (enabled: boolean) => void;
}

function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

export const VideoJSPlayer = React.memo(function VideoJSPlayer({
  url,
  title,
  variant = "default",
  channelLabel,
  active = true,
  soundEnabled = false,
  onSoundEnabledChange,
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const lastMetricAtRef = useRef<Record<string, number>>({});
  const titleRef = useRef(title);
  titleRef.current = title;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [skipCodecCheck, setSkipCodecCheck] = useState(false);

  const reportMetric = useCallback(async (type: string, value: number) => {
    if (!active) return;
    const channel = titleRef.current;
    const now = Date.now();
    const key = `${type}:${channel}`;
    if (now - (lastMetricAtRef.current[key] ?? 0) < METRIC_THROTTLE_MS) return;
    lastMetricAtRef.current[key] = now;

    try {
      await fetch("/api/streams/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type, value }),
      });
    } catch {}
  }, [active]);

  useEffect(() => {
    setSkipCodecCheck(false);
  }, [url]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let hls: Hls | null = null;
    let disposed = false;
    let meterInterval: ReturnType<typeof setInterval> | null = null;
    let blackScreenInterval: ReturnType<typeof setInterval> | null = null;


    setIsBlackScreen(false);
    setLoadError(null);
    setPlaybackBlocked(false);

    const setPlaybackIssue = (issue: StreamPlaybackIssue) => {
      if (issue === "none") return;
      setPlaybackBlocked(true);
      setLoadError(streamPlaybackErrorMessage(issue));
    };

    if (!skipCodecCheck) {
      const playbackIssue = detectStreamPlaybackIssue();
      if (playbackIssue !== "none") {
        setPlaybackIssue(playbackIssue);
        return () => {
          disposed = true;
        };
      }
    }

    const applySound = () => {
      videoEl.muted = !soundEnabledRef.current;
      if (soundEnabledRef.current) videoEl.volume = 1;
    };

    let playAttempts = 0;
    let playRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const tryPlay = () => {
      if (disposed || !isPageVisible()) return;
      videoEl.muted = true;
      const p = videoEl.play();
      if (!p || typeof p.then !== "function") {
        applySound();
        return;
      }
      p.then(() => {
        if (disposed) return;
        playAttempts = 0;
        setLoadError(null);
        applySound();
      }).catch(() => {
        if (disposed) return;
        playAttempts += 1;
        if (playAttempts < 8) {
          playRetryTimer = setTimeout(tryPlay, 250 * playAttempts);
          return;
        }
        if (videoEl.paused && videoEl.readyState < 2) {
          setLoadError("No se pudo iniciar la reproducción");
        }
      });
    };

    const schedulePlay = () => {
      if (videoEl.readyState >= 2) {
        tryPlay();
        return;
      }
      videoEl.addEventListener("canplay", tryPlay, { once: true });
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 30,
      });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, schedulePlay);
      let mediaRecoveries = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (mediaRecoveries < 2) {
              mediaRecoveries += 1;
              hls?.recoverMediaError();
            } else {
              setPlaybackIssue("no-codec");
              reportMetric("ERROR", 1);
            }
            break;
          default:
            setLoadError("Error al cargar la señal");
            reportMetric("ERROR", 1);
            break;
        }
      });
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = url;
      videoEl.addEventListener("loadedmetadata", schedulePlay, { once: true });
    } else {
      setPlaybackIssue("no-native-hls");
    }

    const onVideoError = () => {
      if (disposed) return;
      if (isVideoDecodeError(videoEl)) {
        setPlaybackIssue("no-codec");
        reportMetric("ERROR", 1);
      }
    };
    videoEl.addEventListener("error", onVideoError);


    if (active) {

      const mCanvas = document.createElement("canvas");
      mCanvas.width = 16;
      mCanvas.height = 16;
      const mCtx = mCanvas.getContext("2d", { willReadFrequently: true });
      let prevLuma = 0;
      let currentVol = 0;

      const updateMeterUI = (level: number) => {
        if (!meterRef.current) return;
        const activeSegments = Math.ceil(level * METER_SEGMENTS);
        const bar = meterRef.current.children[0];
        if (!bar) return;
        for (let i = 0; i < bar.children.length; i++) {
          const child = bar.children[i] as HTMLElement;
          if (child) child.style.opacity = i < activeSegments ? "1" : "0.2";
        }
      };

      meterInterval = setInterval(() => {
        if (disposed) return;
        if (!isPageVisible() || videoEl.paused || videoEl.ended) {
          updateMeterUI(0);
          return;
        }

        let targetVol = 0.08;
        if (mCtx) {
          try {
            mCtx.drawImage(videoEl, 0, 0, 16, 16);
            const frame = mCtx.getImageData(0, 0, 16, 16);
            const data = frame.data;
            let totalLuma = 0;
            for (let i = 0; i < data.length; i += 4) {
              totalLuma +=
                data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            }
            const avgLuma = totalLuma / (data.length / 4);
            const delta = Math.abs(avgLuma - prevLuma);
            prevLuma = avgLuma;
            targetVol = Math.min(delta / 5, 1);
            if (targetVol < 0.05) targetVol = 0.05;
          } catch {
            targetVol = 0.1;
          }
        }

        currentVol += (targetVol - currentVol) * 0.35;
        updateMeterUI(currentVol);
      }, METER_TICK_MS);


      const bsCanvas = document.createElement("canvas");
      bsCanvas.width = 32;
      bsCanvas.height = 32;
      const bsCtx = bsCanvas.getContext("2d", { willReadFrequently: true });

      blackScreenInterval = setInterval(() => {
        if (disposed || !isPageVisible() || videoEl.paused || videoEl.ended) return;
        try {
          if (!bsCtx) return;
          bsCtx.drawImage(videoEl, 0, 0, 32, 32);
          const frame = bsCtx.getImageData(0, 0, 32, 32);
          const data = frame.data;
          let totalBrightness = 0;
          let samples = 0;
          for (let i = 0; i < data.length; i += 16) {
            totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            samples++;
          }
          const avgBrightness = totalBrightness / samples;

          if (avgBrightness < 5) {
            setIsBlackScreen(true);
            reportMetric("BLACK_SCREEN", avgBrightness);
          } else {
            setIsBlackScreen(false);
          }
        } catch {}
      }, BLACK_SCREEN_INTERVAL_MS);
    }

    const onVisibility = () => {
      if (disposed) return;
      if (document.visibilityState === "hidden") {
        videoEl.pause();
      } else {
        tryPlay();
      }
    };
    const onPlaying = () => {
      if (!disposed) {
        playAttempts = 0;
        setLoadError(null);
      }
    };
    videoEl.addEventListener("playing", onPlaying);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      videoEl.removeEventListener("error", onVideoError);
      videoEl.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", onVisibility);

      if (meterInterval) clearInterval(meterInterval);
      if (blackScreenInterval) clearInterval(blackScreenInterval);
      if (playRetryTimer) clearTimeout(playRetryTimer);

      if (hls) {
        hls.destroy();
      } else {
        videoEl.src = "";
      }
    };
  }, [url, active, reportMetric, skipCodecCheck]);

  const copyStreamUrl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void navigator.clipboard.writeText(url).then(
        () => toast.success("URL copiada (ábrela en VLC o Chrome)"),
        () => toast.error("No se pudo copiar la URL")
      );
    },
    [url]
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || videoEl.paused) return;
    videoEl.muted = !soundEnabled;
    if (soundEnabled) videoEl.volume = 1;
  }, [soundEnabled]);

  const handleSoundToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = !soundEnabled;
      onSoundEnabledChange?.(next);
      const videoEl = videoRef.current;
      if (!videoEl) return;
      if (next) {
        videoEl.muted = false;
        videoEl.volume = 1;
        setLoadError(null);
        const p = videoEl.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            videoEl.muted = true;
          });
        }
      } else {
        videoEl.muted = true;
      }
    },
    [soundEnabled, onSoundEnabledChange]
  );

  const isProgram = variant === "program";
  const isPreview = variant === "preview";
  const showMeter = active && (isProgram || isPreview);

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-sm border-[2px] bg-black ${
        isProgram
          ? "border-red-500"
          : isPreview
            ? "border-green-500"
            : "border-border"
      }`}
    >
      <div
        className={`absolute top-0 left-0 z-40 max-w-[85%] px-2.5 py-1 ${
          isProgram ? "bg-red-600" : isPreview ? "bg-green-600" : "bg-card/90"
        }`}
      >
        <span
          className={`block truncate font-semibold ${
            isProgram || isPreview
              ? "text-[10px] uppercase tracking-wide text-white"
              : "text-[11px] text-foreground/90"
          }`}
          title={channelLabel || title}
        >
          {channelLabel || title}
        </span>
      </div>

      {(isProgram || isPreview) && (
        <div
          className={`absolute top-0 right-0 z-40 px-2.5 py-1 text-[10px] font-semibold text-white ${
            isProgram ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {isProgram ? "Al aire" : "Vista previa"}
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-[35] flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center">
          <span className="max-w-md text-xs leading-relaxed font-medium text-white/90">
            {loadError}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {playbackBlocked && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSkipCodecCheck(true);
                    setPlaybackBlocked(false);
                    setLoadError(null);
                  }}
                >
                  Intentar de todos modos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
                  onClick={copyStreamUrl}
                >
                  Copiar URL
                </Button>
              </>
            )}
            {!playbackBlocked && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setLoadError(null);
                  const el = videoRef.current;
                  if (!el) return;
                  el.muted = true;
                  const p = el.play();
                  if (p && typeof p.then === "function") {
                    p.then(() => {
                      el.muted = !soundEnabled;
                      if (soundEnabled) el.volume = 1;
                    }).catch(() => setLoadError("No se pudo iniciar la reproducción"));
                  }
                }}
              >
                Reintentar
              </Button>
            )}
          </div>
        </div>
      )}

      {isBlackScreen && active && !loadError && (
        <div className="absolute top-8 left-2 z-30">
          <span className="rounded-sm bg-red-600/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
            Sin señal
          </span>
        </div>
      )}

      {onSoundEnabledChange && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute bottom-2 left-2 z-50 h-8 w-8 rounded-sm border border-white/10 bg-black/70 text-white hover:bg-black/90 hover:text-white"
          onClick={handleSoundToggle}
          aria-label={soundEnabled ? "Silenciar audio" : "Activar audio"}
          title={soundEnabled ? "Silenciar" : "Activar sonido"}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 opacity-80" />
          )}
        </Button>
      )}

      {showMeter && (
        <div
          ref={meterRef}
          className={`pointer-events-none absolute bottom-2 right-2 z-30 flex gap-[2px] rounded-sm border border-white/5 bg-black/60 p-1.5 ${
            isProgram || isPreview ? "h-28 px-2" : "h-20 px-1.5"
          }`}
        >
          <div className={isProgram || isPreview ? "w-2.5" : "w-2"}>
            {Array.from({ length: METER_SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className={`mb-px h-[7%] w-full ${
                  i > METER_SEGMENTS - 4
                    ? "bg-red-500"
                    : i > METER_SEGMENTS - 7
                      ? "bg-yellow-400"
                      : "bg-green-500"
                }`}
                style={{ opacity: 0.2 }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="h-full w-full bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
});
