"use client";

import { useState, useEffect } from "react";
import { VideoJSPlayer } from "@/components/VideoJSPlayer";
import { MonitoringStats } from "@/components/MonitoringStats";
import { StreamList } from "@/components/StreamList";
import { LayoutGrid, Maximize, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonitoreoPage() {
    const streams = [
        { title: "Enlace TV", url: "https://livecdn.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8" },
        { title: "Planeta Creación", url: "https://livecdn.enlace.plus/planetacreacion/smil:planetacreacion-hd.smil/playlist.m3u8" },
        { title: "EJTV", url: "https://livecdn.enlace.plus/ejtv/smil:ejtv-hd.smil/playlist.m3u8" },
        { title: "En Concierto", url: "https://livecdn.enlace.plus/enconcierto/smil:enconcierto-hd.smil/playlist.m3u8" },
        { title: "Los Evangelios", url: "https://livecdn.enlace.plus/evangelios/smil:evangelios-hd.smil/playlist.m3u8" },
        { title: "Armando Alducin", url: "https://livecdn.enlace.plus/armandoalducin/smil:aatv-hd.smil/playlist.m3u8" },
        { title: "Mujeres de Fe", url: "https://livecdn.enlace.plus/mujeresdefe/smil:mujeresdefe-hd.smil/playlist.m3u8" },
    ];

    const [viewMode, setViewMode] = useState<'grid' | 'spotlight'>('grid');
    const [selectedStream, setSelectedStream] = useState(streams[0]);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#020202] text-white overflow-hidden relative font-sans selection:bg-[#FF0C60]/30 text-sm">
            {/* Ambient Background - Exact Replica from Dashboard */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
            </div>

            {/* Command Center Header - Glass */}
            <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between shrink-0 z-50 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Control Máster
                        </h1>
                        <span className="text-[9px] text-zinc-500 font-bold font-mono uppercase tracking-[0.2em] mt-1.5 ml-0.5">
                            Monitoreo en Vivo
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 font-mono text-[10px] text-zinc-300 backdrop-blur-sm">
                        <Clock className="w-3 h-3 text-[#FF0C60]" />
                        {currentTime}
                    </div>

                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/5 backdrop-blur-sm">
                        <Button
                            variant={viewMode === 'spotlight' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('spotlight')}
                            className={`h-7 w-7 rounded-md transition-all ${viewMode === 'spotlight' ? 'bg-[#FF0C60] text-white hover:bg-[#FF0C60]/90' : 'text-zinc-400 hover:text-white'}`}
                            title="Spotlight"
                        >
                            <Maximize className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={`h-7 w-7 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#FF0C60] text-white hover:bg-[#FF0C60]/90' : 'text-zinc-400 hover:text-white'}`}
                            title="Video Wall"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* --- SPOTLIGHT MODE --- */}
                {viewMode === 'spotlight' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in duration-500">
                        {/* Main Player Area */}
                        <div className="lg:col-span-9 flex flex-col h-full">
                            <div className="flex-1 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl ring-1 ring-white/5 group">
                                <VideoJSPlayer
                                    key={selectedStream.title}
                                    title={selectedStream.title}
                                    url={selectedStream.url}
                                />
                            </div>
                        </div>

                        {/* Sidebar Selector */}
                        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                            <StreamList
                                streams={streams}
                                selectedStream={selectedStream}
                                onSelect={setSelectedStream}
                            />
                            <div className="mt-auto">
                                <MonitoringStats />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- GRID MODE --- */}
                {viewMode === 'grid' && (
                    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {streams.map((stream) => (
                                <div key={stream.title} className="aspect-video bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                                    <VideoJSPlayer title={stream.title} url={stream.url} />
                                </div>
                            ))}
                        </div>

                        {/* Stats Footer in Grid Mode */}
                        <div className="w-full mt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Métricas de Rendimiento</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                            <MonitoringStats />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
