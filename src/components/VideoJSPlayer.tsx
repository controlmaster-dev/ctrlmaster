"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoJSPlayerProps {
    url: string;
    title: string;
}

export function VideoJSPlayer({ url, title }: VideoJSPlayerProps) {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    // Monitoring Refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const meterRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);

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
            videoRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: true,
                controls: true,
                responsive: true,
                fill: true, // Force fill container instead of fluid calculation
                muted: true,
                sources: [
                    {
                        src: url,
                        type: "application/x-mpegURL",
                    },
                ],
            });

            playerRef.current = player;

            player.ready(() => {
                const videoEl = videoElement.querySelector('video') as HTMLVideoElement;
                if (!videoEl) return;

                // 1. Black Screen Detection
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
                            // Sample pixels to save CPU
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

                // 2. Hybrid Audio/Motion Meter
                const setupHybridMeter = () => {
                    // Motion Detection Setup
                    const mCanvas = document.createElement('canvas');
                    mCanvas.width = 16;
                    mCanvas.height = 16;
                    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
                    let prevLuma = 0;

                    // Audio Context State
                    let audioCtx: AudioContext | null = null;
                    let analyser: AnalyserNode | null = null;
                    let source: MediaElementAudioSourceNode | null = null;

                    // Throttling state
                    let lastFrameTime = 0;
                    let lastMotionCheck = 0;
                    let targetVol = 0;
                    let currentVol = 0;

                    const draw = (timestamp: number) => {
                        if (!playerRef.current || playerRef.current.isDisposed()) return;

                        animationRef.current = requestAnimationFrame(draw);

                        // Throttle 20fps
                        if (timestamp - lastFrameTime < 50) return;
                        lastFrameTime = timestamp;

                        if (player.paused() || player.ended()) {
                            const canvas = meterRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                            currentVol = 0;
                            targetVol = 0;
                            return;
                        }

                        // Dynamic Audio Context Management
                        // @ts-ignore
                        const isUnmuted = !player.muted() && player.volume && player.volume() > 0;
                        let usingRealAudio = false;

                        if (isUnmuted) {
                            // Create Context if missing
                            if (!audioCtx) {
                                try {
                                    // @ts-ignore
                                    const CtxClass = window.AudioContext || window.webkitAudioContext;
                                    if (CtxClass) {
                                        audioCtx = new CtxClass();
                                        analyser = audioCtx.createAnalyser();
                                        analyser.fftSize = 32;
                                        analyser.smoothingTimeConstant = 0.8;
                                        source = audioCtx.createMediaElementSource(videoEl);
                                        source.connect(analyser);
                                        analyser.connect(audioCtx.destination);
                                    }
                                } catch (e) {
                                    // console.warn("Audio Context Init Failed", e);
                                }
                            }

                            // Read Data
                            if (analyser && audioCtx?.state === 'running') {
                                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                                analyser.getByteFrequencyData(dataArray);
                                let sum = 0;
                                for (let i = 0; i < dataArray.length; i++) {
                                    sum += dataArray[i] * dataArray[i];
                                }
                                const rms = Math.sqrt(sum / dataArray.length) / 255;
                                if (rms > 0.01) {
                                    targetVol = rms;
                                    usingRealAudio = true;
                                }
                            }
                        } else {
                            // Shutdown Context if exists (Switch to Motion)
                            if (audioCtx) {
                                audioCtx.close().catch(() => { });
                                audioCtx = null;
                                analyser = null;
                                source = null;
                            }
                        }

                        // Fallback: Motion Detection
                        if (!usingRealAudio && mCtx) {
                            if (timestamp - lastMotionCheck > 200) {
                                try {
                                    mCtx.drawImage(videoEl, 0, 0, 16, 16);
                                    const frame = mCtx.getImageData(0, 0, 16, 16);
                                    let currentLuma = 0;
                                    for (let i = 0; i < frame.data.length; i += 16) {
                                        currentLuma += frame.data[i] + frame.data[i + 1] + frame.data[i + 2];
                                    }
                                    const diff = Math.abs(currentLuma - prevLuma) / 5000;
                                    prevLuma = currentLuma;

                                    const jitter = diff > 0.01 ? Math.random() * 0.1 : 0;
                                    targetVol = Math.min(diff + jitter, 0.8);
                                    lastMotionCheck = timestamp;
                                } catch (e) { }
                            }
                        }

                        // Smooth interpolation
                        currentVol += (targetVol - currentVol) * 0.3;

                        // Draw
                        const canvas = meterRef.current;
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                const HEIGHT = canvas.height;
                                const barWidth = 4;
                                const gap = 2;
                                ctx.clearRect(0, 0, canvas.width, canvas.height);

                                let h = Math.max(currentVol, 0.02) * HEIGHT;
                                ctx.fillStyle = currentVol > 0.8 ? '#ef4444' : currentVol > 0.6 ? '#f59e0b' : '#10b981';
                                ctx.fillRect(0, HEIGHT - h, barWidth, h);
                                ctx.fillRect(barWidth + gap, HEIGHT - h, barWidth, h);
                            }
                        }
                    };

                    animationRef.current = requestAnimationFrame(draw);

                    return () => {
                        if (audioCtx) audioCtx.close();
                    };
                };

                const cleanupMeter = setupHybridMeter();

                // Attach cleanup
                player.on('dispose', () => cleanupMeter());
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
            // No AudioContext to close anymore

            const player = playerRef.current;
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div className={`relative w-full h-full group ${isBlackScreen ? 'border-2 border-red-500' : ''}`}>
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-2 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                <span className="text-white text-xs font-bold font-mono bg-black/50 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                    {title}
                </span>
                {isBlackScreen && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded animate-pulse shadow-lg shadow-red-500/50">
                        VIDEO LOSS
                    </span>
                )}
            </div>

            {/* LIVE Tag Overlay */}
            <div className="absolute bottom-2 right-2 z-10 pointer-events-none flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-white tracking-widest">LIVE</span>
            </div>

            {/* VU Meter Overlay (Right Side) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20 h-16 w-[10px] bg-black/40 backdrop-blur-sm rounded-sm border border-white/10 overflow-hidden flex justify-center items-end pb-1 pointer-events-none">
                <canvas ref={meterRef} width={10} height={64} />
            </div>

            <div data-vjs-player className="h-full w-full bg-black">
                <div ref={videoRef} className="h-full w-full object-contain" />
            </div>
        </div>
    );
}
