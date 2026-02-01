"use client";

import { useState, useEffect } from "react";
import { VideoJSPlayer } from "@/components/VideoJSPlayer";
import { MonitoringStats } from "@/components/MonitoringStats";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function MonitoreoPage() {
    const streams = [
        { title: "Enlace TV", url: "https://livecdn.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8", label: "CAM 01" },
        { title: "EJTV", url: "https://livecdn.enlace.plus/ejtv/smil:ejtv-hd.smil/playlist.m3u8", label: "CAM 02" },
        { title: "Planeta Creación", url: "https://livecdn.enlace.plus/planetacreacion/smil:planetacreacion-hd.smil/playlist.m3u8", label: "CAM 03" },
        { title: "En Concierto", url: "https://livecdn.enlace.plus/enconcierto/smil:enconcierto-hd.smil/playlist.m3u8", label: "CAM 04" },
        { title: "Los Evangelios", url: "https://livecdn.enlace.plus/evangelios/smil:evangelios-hd.smil/playlist.m3u8", label: "CAM 05" },
        { title: "Armando Alducin", url: "https://livecdn.enlace.plus/armandoalducin/smil:aatv-hd.smil/playlist.m3u8", label: "CAM 06" },
        { title: "Mujeres de Fe", url: "https://livecdn.enlace.plus/mujeresdefe/smil:mujeresdefe-hd.smil/playlist.m3u8", label: "CAM 07" },
    ];

    const [currentTime, setCurrentTime] = useState("");
    const [pvwIndex, setPvwIndex] = useState(0);
    const [prgIndex, setPrgIndex] = useState(1);

    // Initial state from localStorage
    useEffect(() => {
        const savedPvw = localStorage.getItem('enlace_pvw_index');
        const savedPrg = localStorage.getItem('enlace_prg_index');
        if (savedPvw !== null) setPvwIndex(parseInt(savedPvw));
        if (savedPrg !== null) setPrgIndex(parseInt(savedPrg));
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('enlace_pvw_index', pvwIndex.toString());
        localStorage.setItem('enlace_prg_index', prgIndex.toString());
    }, [pvwIndex, prgIndex]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Switcher Logic
    const handleCut = () => {
        const temp = pvwIndex;
        setPvwIndex(prgIndex);
        setPrgIndex(temp);
    };

    const handleSelectPreview = (idx: number) => {
        if (idx !== prgIndex) {
            setPvwIndex(idx);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleCut();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pvwIndex, prgIndex]);

    return (
        <div className="flex flex-col min-h-screen bg-[#111] text-zinc-400 font-sans overflow-y-auto">
            {/* Global Styles for VideoJS Cleanup */}
            <style jsx global>{`
                .vjs-control-bar, .vjs-big-play-button, .vjs-loading-spinner, .vjs-text-track-display, .vjs-modal-dialog {
                    display: none !important;
                }
                .video-js {
                    background-color: transparent !important;
                }
                /* Hide scrollbar for full immersion */
                ::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
            `}</style>

            {/* Multiview Top Bar */}
            <div className="h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0 font-mono">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-zinc-500 tracking-wider">Multiview 1</span>
                    <span className="text-xs font-bold text-white tracking-widest">{currentTime}</span>
                    <div className="h-4 w-[1px] bg-zinc-700 mx-2" />
                    <span className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded border border-white/5 font-mono">
                        Tocá <span className="text-white font-bold text-xs">ESPACIO</span> O
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 gap-2 text-[10px] font-bold tracking-widest hover:bg-[#333] hover:text-white transition-colors">
                                <Activity className="w-3 h-3" />
                                Estado:
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl bg-black/95 backdrop-blur-2xl border-white/5 text-white p-0 overflow-hidden shadow-2xl">
                            <MonitoringStats />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* MASTER ROW: PREVIEW & PROGRAM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 shrink-0">
                <div
                    className="relative bg-black cursor-pointer group/master overflow-hidden aspect-video"
                    onClick={handleCut}
                    title="Clic para CORTAR"
                >
                    <VideoJSPlayer
                        title={streams[pvwIndex]?.title || "SIN SEÑAL"}
                        url={streams[pvwIndex]?.url || ""}
                        variant="preview"
                    />
                    {/* Hover Overlay indicator for Cut */}
                    <div className="absolute inset-0 bg-green-500/0 group-hover/master:bg-green-500/5 transition-colors z-50 flex items-center justify-center pointer-events-none">
                        <span className="opacity-0 group-hover/master:opacity-100 text-[10px] font-black text-green-500 bg-black/80 px-4 py-1 rounded-full border border-green-500/20 tracking-[0.3em] uppercase transition-all duration-300 transform translate-y-2 group-hover/master:translate-y-0">Clic para Cortar</span>
                    </div>
                </div>

                <div className="relative bg-black overflow-hidden aspect-video">
                    <VideoJSPlayer
                        title={streams[prgIndex]?.title || "SIN SEÑAL"}
                        url={streams[prgIndex]?.url || ""}
                        variant="program"
                    />
                </div>
            </div>

            {/* SLAVE GRID: Adaptive layout for remaining sources */}
            <div className="flex-1 bg-black p-2 pt-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* All available cameras in the grid */}
                {Array.from({ length: 8 }).map((_, i) => {
                    const stream = streams[i];
                    const isPVW = i === pvwIndex;
                    const isPRG = i === prgIndex;

                    return (
                        <div
                            key={`grid-${i}`}
                            onClick={() => stream && handleSelectPreview(i)}
                            className="relative bg-black group transition-all duration-300 aspect-video cursor-pointer"
                        >
                            {stream ? (
                                <VideoJSPlayer
                                    title={stream.title}
                                    url={stream.url}
                                    variant={isPRG ? 'program' : isPVW ? 'preview' : 'default'}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center border border-white/5 bg-[#080808]">
                                    <span className="text-zinc-800 font-bold text-2xl uppercase opacity-20 tracking-tighter">SIN SEÑAL</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
