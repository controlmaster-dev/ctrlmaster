"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";

const METER_SEGMENTS = 12;
const METER_TICK_MS = 300;
const BLACK_SCREEN_INTERVAL_MS = 15000;
const METRIC_THROTTLE_MS = 60000;

interface VideoJSPlayerProps {
  url: string;
  title: string;
  variant?: "default" | "program" | "preview";
  channelLabel?: string;
  /** Activa medidor y detección de pantalla negra (solo reproductores principales). */
  active?: boolean;
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
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const meterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blackScreenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMetricAtRef = useRef<Record<string, number>>({});
  const titleRef = useRef(title);
  titleRef.current = title;
  const [isBlackScreen, setIsBlackScreen] = useState(false);

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
    } catch {
      /* métricas opcionales */
    }
  }, [active]);

  const clearTimers = useCallback(() => {
    if (meterTimerRef.current) {
      clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
    if (blackScreenTimerRef.current) {
      clearInterval(blackScreenTimerRef.current);
      blackScreenTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    let disposed = false;
    const initialUrl = url;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered", "w-full", "h-full");
    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("webkit-playsinline", "true");
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      autoplay: false,
      controls: false,
      responsive: true,
      fill: true,
      muted: true,
      preload: "auto",
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          limitRenditionByPlayerDimensions: true,
        },
      },
      sources: [{ src: initialUrl, type: "application/x-mpegURL" }],
    });

    playerRef.current = player;

    const tryPlay = () => {
      if (disposed || !isPageVisible()) return;
      const p = player.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    player.ready(() => {
      if (disposed) return;
      tryPlay();

      if (!active) return;

      const videoEl = videoElement.querySelector("video");
      if (!videoEl) return;

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

      meterTimerRef.current = setInterval(() => {
        if (disposed || !playerRef.current || playerRef.current.isDisposed()) return;
        if (!isPageVisible() || player.paused()) {
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

      blackScreenTimerRef.current = setInterval(() => {
        if (disposed || !isPageVisible() || player.paused() || player.ended()) return;
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
        } catch {
          /* CORS o frame no listo */
        }
      }, BLACK_SCREEN_INTERVAL_MS);
    });

    player.on("error", () => reportMetric("ERROR", 1));

    const onVisibility = () => {
      if (disposed || player.isDisposed()) return;
      if (document.visibilityState === "hidden") {
        player.pause();
      } else {
        tryPlay();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
      if (!player.isDisposed()) {
        player.dispose();
      }
      playerRef.current = null;
      if (videoRef.current) videoRef.current.innerHTML = "";
    };
    // Solo montar/desmontar el reproductor una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    player.src({ src: url, type: "application/x-mpegURL" });
    if (isPageVisible()) {
      const p = player.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [url]);

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

      {isBlackScreen && active && (
        <div className="absolute top-8 left-2 z-30">
          <span className="rounded-sm bg-red-600/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
            Sin señal
          </span>
        </div>
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

      <div data-vjs-player className="h-full w-full bg-black">
        <div ref={videoRef} className="h-full w-full object-cover" />
      </div>
    </div>
  );
});
