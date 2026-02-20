"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoJSPlayerProps {
    url: string;
    title: string;
    variant?: 'default' | 'program' | 'preview';
    channelLabel?: string;
}

export function VideoJSPlayer({ url, title, variant = 'default', channelLabel }: VideoJSPlayerProps) {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    // Monitoring Refs
    const meterRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // States for visual feedback
    const [isBlackScreen, setIsBlackScreen] = useState(false);

    // Function to report metrics
    const reportMetric = async (type: string, value: number) => {
        try {
            await fetch('/api/streams/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: title,
                    type,
                    value,
                }),
            });
        } catch (err) {
            console.error("Failed to report metric", err);
        }
    };

    useEffect(() => {
        if (!playerRef.current) {
            if (!videoRef.current) return;

            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered", "w-full", "h-full");
            videoElement.setAttribute("crossOrigin", "anonymous");
            videoElement.setAttribute("playsinline", "true");
            videoElement.setAttribute("webkit-playsinline", "true");
            videoElement.setAttribute("crossorigin", "anonymous");
            videoRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: true,
                controls: false,
                responsive: true,
                fill: true,
                muted: true,
                sources: [{ src: url, type: "application/x-mpegURL" }],
            });

            playerRef.current = player;

            player.ready(() => {
                const videoEl = videoElement.querySelector('video') as HTMLVideoElement;
                if (!videoEl) return;

                videoEl.crossOrigin = "anonymous";

                const setupSmartMeter = () => {
                    const mCanvas = document.createElement('canvas');
                    mCanvas.width = 32;
                    mCanvas.height = 32;
                    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
                    let prevLuma = 0;

                    let lastFrameTime = 0;
                    let currentVol = 0;
                    let targetVol = 0;

                    const updateMeterUI = (level: number) => {
                        if (!meterRef.current) return;
                        const segments = 24;
                        const activeSegments = Math.ceil(level * segments);

                        const leftBar = meterRef.current.children[0];
                        if (leftBar) {
                            const children = leftBar.children;
                            for (let i = 0; i < children.length; i++) {
                                const child = children[i] as HTMLElement | undefined;
                                if (child) {
                                    child.style.opacity = i < activeSegments ? "1" : "0.2";
                                }
                            }
                        }

                        const rightBar = meterRef.current.children[1];
                        if (rightBar) {
                            const children = rightBar.children;
                            const jitter = Math.random() * 0.1 - 0.05;
                            const rightLevel = Math.max(0, Math.min(1, level + jitter));
                            const activeRight = Math.ceil(rightLevel * segments);
                            for (let i = 0; i < children.length; i++) {
                                const child = children[i] as HTMLElement | undefined;
                                if (child) {
                                    child.style.opacity = i < activeRight ? "1" : "0.2";
                                }
                            }
                        }
                    };

                    const loop = (timestamp: number) => {
                        if (!playerRef.current || playerRef.current.isDisposed()) return;
                        animationRef.current = requestAnimationFrame(loop);

                        if (timestamp - lastFrameTime < 33) return;
                        lastFrameTime = timestamp;

                        if (player.paused() || player.ended()) {
                            updateMeterUI(0);
                            return;
                        }

                        // @ts-ignore
                        const isUnmuted = !player.muted() && player.volume && player.volume() > 0;

                        if (!isUnmuted && mCtx) {
                            try {
                                mCtx.drawImage(videoEl, 0, 0, 32, 32);
                                const frame = mCtx.getImageData(0, 0, 32, 32);
                                const data = frame.data;
                                let totalLuma = 0;
                                for (let i = 0; i < data.length; i += 4) {
                                    totalLuma += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                                }
                                const avgLuma = totalLuma / (data.length / 4);
                                const delta = Math.abs(avgLuma - prevLuma);
                                prevLuma = avgLuma;
                                let motionVol = Math.min(delta / 5, 1);
                                if (motionVol > targetVol) {
                                    targetVol = motionVol;
                                } else {
                                    targetVol *= 0.9;
                                }
                                if (targetVol < 0.05) targetVol = Math.random() * 0.05;
                            } catch (e) {
                                targetVol = Math.random() * 0.2;
                            }
                        } else {
                            targetVol = Math.random() * 0.8;
                        }

                        currentVol += (targetVol - currentVol) * 0.2;
                        updateMeterUI(currentVol);
                    };

                    animationRef.current = requestAnimationFrame(loop);
                };

                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                canvasRef.current = canvas;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                intervalRef.current = setInterval(() => {
                    if (player.paused() || player.ended()) return;
                    try {
                        if (ctx && canvas) {
                            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = frame.data;
                            let totalBrightness = 0;
                            for (let i = 0; i < data.length; i += 16) {
                                totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
                            }
                            const avgBrightness = totalBrightness / (data.length / 16);

                            if (avgBrightness < 5) {
                                setIsBlackScreen(true);
                                reportMetric('BLACK_SCREEN', avgBrightness);
                            } else {
                                setIsBlackScreen(false);
                            }
                        }
                    } catch (e) { /* Ignore */ }
                }, 5000);

                setupSmartMeter();
            });

            player.on('error', () => reportMetric('ERROR', 1));

        } else {
            const player = playerRef.current;
            player.src({ src: url, type: "application/x-mpegURL" });
        }
    }, [url, title]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            const player = playerRef.current;
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    const isProgram = variant === 'program';
    const isPreview = variant === 'preview';
    const themeColor = isProgram ? '#ef4444' : isPreview ? '#22c55e' : 'var(--border)';

    return (
        <div className={`relative w-full h-full group bg-black overflow-hidden border-[2px] transition-all duration-500 rounded-sm ${isProgram ? 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' : isPreview ? 'shadow-[0_0_20px_rgba(34,197,94,0.2)]' : ''}`}
            style={{ borderColor: themeColor }}>

            {/* Inner Tally Glow */}
            {(isProgram || isPreview) && (
                <div className={`absolute inset-0 pointer-events-none z-10 border-[1px] opacity-20 ${isProgram ? 'border-red-500' : 'border-green-500'}`} />
            )}

            {/* Industrial Label: Top Left */}
            <div className={`absolute top-0 left-0 z-40 px-2.5 py-1 ${isProgram ? 'bg-red-600' : isPreview ? 'bg-green-600' : 'bg-card/90 backdrop-blur-md'} flex items-center shadow-lg border-b border-r border-white/5`}>
                <div className={`w-1 h-1 rounded-full mr-2 ${isProgram || isPreview ? 'bg-white animate-pulse' : 'bg-primary/40'}`} />
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isProgram || isPreview ? 'text-white' : 'text-foreground/90'}`}>
                    {channelLabel || title}
                </span>
            </div>

            {/* Program/Preview Status: Top Right */}
            {(isProgram || isPreview) && (
                <div className={`absolute top-0 right-0 z-40 px-2.5 py-1 ${isProgram ? 'bg-red-600' : isPreview ? 'bg-green-600' : ''} shadow-lg border-b border-l border-white/5`}>
                    <span className="text-[9px] font-bold tracking-[0.2em] text-white uppercase">
                        {isProgram ? 'PROGRAMA' : 'PREVIA'}
                    </span>
                </div>
            )}

            {/* SIN SEÑAL Warning */}
            {isBlackScreen && (
                <div className="absolute top-8 left-2 z-30">
                    <span className="text-[9px] font-medium bg-red-600/80 text-white px-2 py-0.5 rounded-sm animate-pulse shadow-lg shadow-red-500/20 uppercase tracking-[0.2em]">
                        Sin Señal
                    </span>
                </div>
            )}

            {/* Precision VU Meter */}
            <div ref={meterRef} className={`absolute bottom-2 right-2 z-30 flex gap-[3px] bg-black/60 p-1.5 rounded-sm border border-white/5 shadow-2xl backdrop-blur-md pointer-events-none ${variant !== 'default' ? 'h-36 px-3' : 'h-24 px-2'}`}>
                <div className={`${variant !== 'default' ? 'w-3' : 'w-2'} h-full flex flex-col-reverse gap-[1px] overflow-hidden`}>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={`l-${i}`} className={`w-full h-[3.8%] ${i > 20 ? 'bg-red-500' : i > 15 ? 'bg-yellow-400' : 'bg-green-500'} opacity-20 transition-all duration-75`} />
                    ))}
                </div>
                <div className={`${variant !== 'default' ? 'w-3' : 'w-2'} h-full flex flex-col-reverse gap-[1px] overflow-hidden`}>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={`r-${i}`} className={`w-full h-[3.8%] ${i > 20 ? 'bg-red-500' : i > 15 ? 'bg-yellow-400' : 'bg-green-500'} opacity-20 transition-all duration-75`} />
                    ))}
                </div>
                <div className="flex flex-col justify-between text-[5px] text-white/20 font-mono ml-0.5">
                    <span>0</span>
                    <span>-10</span>
                    <span>-20</span>
                    <span>-40</span>
                </div>
            </div>

            <div data-vjs-player className="h-full w-full bg-black">
                <div ref={videoRef} className="h-full w-full object-cover" />
            </div>
        </div>
    );
}
