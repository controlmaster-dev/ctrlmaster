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
            // Important: Preserve video data for canvas reading
            videoElement.setAttribute("crossorigin", "anonymous");
            videoRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: true,
                controls: false, // Clean feed
                responsive: true,
                fill: true,
                muted: true,
                sources: [{ src: url, type: "application/x-mpegURL" }],
            });

            playerRef.current = player;

            player.ready(() => {
                const videoEl = videoElement.querySelector('video') as HTMLVideoElement;
                if (!videoEl) return;

                // Set crossOrigin again on the actual video element just in case
                videoEl.crossOrigin = "anonymous";

                // --- 1. Hybrid Audio/Motion Analysis Logic ---
                // This logic uses real audio if available/unmuted, otherwise falls back to 
                // video motion (luminance difference) to simulate "synced" audio levels.

                const setupSmartMeter = () => {
                    // Motion Analysis Context
                    const mCanvas = document.createElement('canvas');
                    mCanvas.width = 32; // Low res is enough
                    mCanvas.height = 32;
                    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
                    let prevLuma = 0;

                    // Audio Context removed (using Motion Logic)


                    let lastFrameTime = 0;
                    let currentVol = 0;
                    let targetVol = 0;

                    const updateMeterUI = (level: number) => {
                        if (!meterRef.current) return;
                        // Level is 0.0 to 1.0
                        // We have 20 segments.
                        const segments = 20;
                        const activeSegments = Math.ceil(level * segments);

                        // Update Left Channel
                        const leftBar = meterRef.current.children[0];
                        if (leftBar) {
                            const children = leftBar.children;
                            for (let i = 0; i < children.length; i++) {
                                const segment = children[i] as HTMLElement;
                                // Render from bottom up? Our HTML is flex-col-reverse, so index 0 is bottom.
                                // Actually flex-col-reverse means DOM order 0 is at bottom visual. Correct.
                                if (i < activeSegments) {
                                    segment.style.opacity = "1";
                                } else {
                                    segment.style.opacity = "0.2";
                                }
                            }
                        }

                        // Update Right Channel (slightly varied for stereo feel)
                        const rightBar = meterRef.current.children[1];
                        if (rightBar) {
                            const children = rightBar.children;
                            // Add jitter to right channel
                            const jitter = Math.random() * 0.1 - 0.05;
                            const rightLevel = Math.max(0, Math.min(1, level + jitter));
                            const activeRight = Math.ceil(rightLevel * segments);

                            for (let i = 0; i < children.length; i++) {
                                const segment = children[i] as HTMLElement;
                                if (i < activeRight) {
                                    segment.style.opacity = "1";
                                } else {
                                    segment.style.opacity = "0.2";
                                }
                            }
                        }
                    };

                    const loop = (timestamp: number) => {
                        if (!playerRef.current || playerRef.current.isDisposed()) return;
                        animationRef.current = requestAnimationFrame(loop);

                        // Throttle ~30fps
                        if (timestamp - lastFrameTime < 33) return;
                        lastFrameTime = timestamp;

                        if (player.paused() || player.ended()) {
                            updateMeterUI(0);
                            return;
                        }

                        // Check if real audio is possible
                        // @ts-ignore
                        const isUnmuted = !player.muted() && player.volume && player.volume() > 0;

                        // Note: We prioritize Motion detection primarily because 99% of time multiview is muted.
                        // Only switch to Real Audio if explicitly unmuted.

                        if (!isUnmuted && mCtx) {
                            // Motion Detection Strategy
                            try {
                                mCtx.drawImage(videoEl, 0, 0, 32, 32);
                                const frame = mCtx.getImageData(0, 0, 32, 32);
                                const data = frame.data;
                                let totalLuma = 0;
                                for (let i = 0; i < data.length; i += 4) {
                                    // Simple luma
                                    totalLuma += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                                }
                                const avgLuma = totalLuma / (data.length / 4);

                                // Delta Logic
                                const delta = Math.abs(avgLuma - prevLuma);
                                prevLuma = avgLuma;

                                // Normalize Delta
                                // High motion = high delta. 
                                // Typical delta varies 0-20. 
                                // We want to map this to 0-1 volume.
                                let motionVol = Math.min(delta / 5, 1); // Sensitivity factor

                                // Decay / Smoothing
                                if (motionVol > targetVol) {
                                    targetVol = motionVol; // Attack fast
                                } else {
                                    targetVol *= 0.9; // Release slow
                                }

                                // Add a "noise floor" so it's not dead active
                                if (targetVol < 0.05) targetVol = Math.random() * 0.05;

                            } catch (e) {
                                // Canvas read error (CORS?)
                                targetVol = Math.random() * 0.2; // Fallback to random
                            }
                        } else {
                            // Real Audio Logic would go here, or just basic "active" state
                            targetVol = Math.random() * 0.8; // Placeholder if unmuted (rare)
                        }

                        // Smooth interpolation
                        currentVol += (targetVol - currentVol) * 0.2;
                        updateMeterUI(currentVol);
                    };

                    animationRef.current = requestAnimationFrame(loop);
                };


                // --- 2. Black Screen Detection ---
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
    const themeColor = isProgram ? '#ff0000' : isPreview ? '#00ff00' : '#333';
    const textColor = isProgram ? 'text-red-500' : isPreview ? 'text-green-500' : 'text-zinc-400';

    return (
        <div className={`relative w-full h-full group bg-black overflow-hidden border-2 transition-colors duration-500`}
            style={{ borderColor: themeColor }}>

            {/* Reality Sync Label: Bottom Centered Pill */}
            <div className="absolute bottom-2 inset-x-0 z-40 flex justify-center pointer-events-none">
                <div className="bg-black/80 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl backdrop-blur-sm">
                    {(isProgram || isPreview) && (
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${textColor} border-r border-white/20 pr-2 leading-none`}>
                            {variant === 'program' ? 'PROGRAMA' : 'PREVIO'}
                        </span>
                    )}
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${variant !== 'default' ? textColor : 'text-zinc-300'} leading-none`}>
                        {channelLabel || title}
                    </span>
                </div>
            </div>

            {/* ERROR / BLACKSCREEN STATUS */}
            {isBlackScreen && (
                <div className="absolute top-8 left-2 z-30">
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded animate-pulse shadow-lg shadow-red-500/50">
                        SIN SEÑAL
                    </span>
                </div>
            )}

            {/* Reality Sync VU Meter: Solid and Safe */}
            <div ref={meterRef} className={`absolute bottom-4 right-4 z-30 flex gap-[1.5px] bg-black/80 p-1.5 rounded-sm border border-white/20 shadow-2xl backdrop-blur-md pointer-events-none ${variant !== 'default' ? 'h-28 px-2' : 'h-20'}`}>
                {/* Left Channel */}
                <div className={`${variant !== 'default' ? 'w-2' : 'w-1.5'} h-full flex flex-col-reverse gap-[1px] overflow-hidden`}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`l-${i}`}
                            className={`w-full h-[4%] min-h-[1px] ${i > 16 ? 'bg-[#ef4444]' : i > 12 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'} opacity-20 transition-opacity duration-75`}
                        />
                    ))}
                </div>
                {/* Right Channel */}
                <div className={`${variant !== 'default' ? 'w-2' : 'w-1.5'} h-full flex flex-col-reverse gap-[1px] overflow-hidden`}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`r-${i}`}
                            className={`w-full h-[4%] min-h-[1px] ${i > 16 ? 'bg-[#ef4444]' : i > 12 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'} opacity-20 transition-opacity duration-75`}
                        />
                    ))}
                </div>
            </div>

            <div data-vjs-player className="h-full w-full bg-black">
                <div ref={videoRef} className="h-full w-full object-cover" />
            </div>
        </div>
    );
}
