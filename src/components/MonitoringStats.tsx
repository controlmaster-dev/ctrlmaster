"use client";

import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Signal, VolumeX, ShieldCheck, Zap } from "lucide-react";

interface Stats {
    uptime: number;
    blackScreens: number;
    silenceEvents: number;
    totalChannels: number;
    activeChannels: number;
}

// Technical sparkline generator
const generateSparklineData = (count: number) => {
    return Array.from({ length: 15 }, (_, i) => ({
        name: i.toString(),
        value: i === 14 ? count / 2 : Math.floor(Math.random() * (count + 10)) + 5
    }));
};

// --- PREMUM COMPONENTS ---

const MetricModule = React.memo(({ title, value, subtext, icon: Icon, color, data, barColor }: any) => (
    <div className="relative group overflow-hidden bg-black/40 border border-white/5 rounded-0 p-5 transition-all duration-500 hover:bg-white/[0.02] hover:border-white/10">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/20" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/20" />

        <div className="flex justify-between items-start relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1 h-3 ${barColor || 'bg-white/20'}`} />
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">{title}</h4>
                </div>
                <div className="text-4xl font-black tracking-tighter text-white font-mono flex items-baseline gap-1">
                    {value}
                </div>
                <div className="text-[9px] text-zinc-600 mt-2 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    {subtext}
                </div>
            </div>
            <div className="p-2 rounded-sm bg-white/[0.03] border border-white/5 shadow-inner">
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
        </div>

        {/* Technical Data Stream Sparkline */}
        <div className="h-14 mt-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <Bar dataKey="value" radius={[0, 0, 0, 0]} isAnimationActive={false}>
                        {data.map((_: any, index: number) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === data.length - 1 ? (barColor || "#333") : "#1a1a1a"}
                                className="transition-all duration-500"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
));

MetricModule.displayName = "MetricModule";

const ChannelModule = ({ channel }: any) => {
    const totalErrors = (channel.blackScreen || 0) + (channel.silence || 0);
    const isCritical = totalErrors > 50;
    const isWarning = totalErrors > 10;

    return (
        <div className="bg-[#050505] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
            {/* Background scanner line effect */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/5 group-hover:bg-white/10 transition-colors" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">PROTO: HLS-V4</span>
                    <span className="text-sm font-black text-white uppercase tracking-tight font-mono">{channel.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${isCritical ? 'border-red-500/50 text-red-500 bg-red-500/5' :
                        isWarning ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' :
                            'border-emerald-500/50 text-emerald-500 bg-emerald-500/5'
                        }`}>
                        {isCritical ? 'CRÍTICO' : isWarning ? 'AVISO' : 'ESTABLE'}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-sm text-center">
                    <div className="text-[14px] font-black text-white font-mono">{(channel.blackScreen || 0).toString().padStart(3, '0')}</div>
                    <div className="text-[7px] text-zinc-500 uppercase tracking-tighter">VIDEO</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-sm text-center">
                    <div className="text-[14px] font-black text-white font-mono">{(channel.silence || 0).toString().padStart(3, '0')}</div>
                    <div className="text-[7px] text-zinc-500 uppercase tracking-tighter">AUDIO</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-sm text-center">
                    <div className="text-[14px] font-black text-zinc-400 font-mono">{(totalErrors).toString().padStart(3, '0')}</div>
                    <div className="text-[7px] text-zinc-600 uppercase tracking-tighter">TOTAL</div>
                </div>
            </div>

            {/* Micro Density Bar */}
            <div className="h-[2px] w-full bg-zinc-900 mt-3 flex rounded-full overflow-hidden">
                <div className="bg-red-500" style={{ width: `${Math.min((channel.blackScreen / 100) * 100, 100)}%` }} />
                <div className="bg-amber-500" style={{ width: `${Math.min((channel.silence / 100) * 100, 100)}%` }} />
            </div>
        </div>
    );
};

export function MonitoringStats() {
    const [stats, setStats] = useState<Stats>({
        uptime: 99.8,
        blackScreens: 0,
        silenceEvents: 0,
        totalChannels: 7,
        activeChannels: 7
    });

    const [channelStats, setChannelStats] = useState<any[]>([]);

    const [trendData] = useState(() => ({
        active: generateSparklineData(20),
        videoLoss: generateSparklineData(50),
        silence: generateSparklineData(30)
    }));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/streams/stats');
                if (res.ok) {
                    const data = await res.json();
                    let blackCtx = 0;
                    let silenceCtx = 0;
                    data.forEach((d: any) => {
                        blackCtx += d.blackScreen || 0;
                        silenceCtx += d.silence || 0;
                    });
                    setStats(prev => ({
                        ...prev,
                        blackScreens: blackCtx,
                        silenceEvents: silenceCtx
                    }));
                    setChannelStats(data);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-[85vh] bg-[#020202] text-white relative overflow-hidden">
            {/* ATMOSPHERIC BACKGROUND */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {/* MASTER HEADER SECTION */}
            <div className="px-10 py-10 border-b border-white/5 relative z-20">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-sm">LIVE</span>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em]">ENLACE CONTROL MASTER // DIVISION LA</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.8]" style={{ fontFamily: 'var(--font-lexend)' }}>
                            ESTADO DEL <span className="text-zinc-600 font-light not-italic">SISTEMA</span>
                        </h1>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1 font-mono text-right">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest text-right">INTEGRIDAD GLOBAL DE RED</span>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xl font-bold text-white tracking-widest">99.998<span className="text-zinc-600">%</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 relative z-20">
                {/* GLOBAL METRIC MODULES */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricModule
                        title="Integridad de Red"
                        value={`${stats.uptime}%`}
                        subtext="Estado del Backbone"
                        icon={Zap}
                        color="text-emerald-400"
                        data={trendData.active}
                        barColor="#10b981"
                    />
                    <MetricModule
                        title="Señales Activas"
                        value={`${stats.activeChannels}/${stats.totalChannels}`}
                        subtext="Nodos Sincronizados"
                        icon={Signal}
                        color="text-blue-400"
                        data={trendData.active}
                        barColor="#3b82f6"
                    />
                    <MetricModule
                        title="Pérdida de Frame"
                        value={stats.blackScreens}
                        subtext="Incidencias (24h)"
                        icon={AlertTriangle}
                        color="text-red-400"
                        data={trendData.videoLoss}
                        barColor="#ef4444"
                    />
                    <MetricModule
                        title="Eventos Audio"
                        value={stats.silenceEvents}
                        subtext="Nivel de Silencio"
                        icon={VolumeX}
                        color="text-amber-400"
                        data={trendData.silence}
                        barColor="#f59e0b"
                    />
                </div>

                {/* TELEMETRY MATRIX BLOCK */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Matriz de Telemetría Dinámica</h2>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic">Escaneando transpondedores...</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-white/5 border border-white/5">
                        {channelStats.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-black h-32 animate-pulse" />
                            ))
                        ) : (
                            channelStats.map((channel) => (
                                <ChannelModule key={channel.name} channel={channel} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* TECHNICAL FOOTER */}
            <div className="px-10 py-4 bg-zinc-950/50 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em] relative z-20">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" /> Hardware: Enlace-TX3000</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" /> Kernel v5.10.x</span>
                    <span className="text-emerald-500/50">ENLACE SEGURO ESTABLECIDO</span>
                </div>
                <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                        <span>SINC. UDP:</span>
                        <span className="text-zinc-400">ACTIVA</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <span>{new Date().toISOString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
