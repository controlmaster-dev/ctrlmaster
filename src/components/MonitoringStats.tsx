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

const generateSparklineData = (count: number) => {
    return Array.from({ length: 15 }, (_, i) => ({
        name: i.toString(),
        value: i === 14 ? count / 2 : Math.floor(Math.random() * (count + 10)) + 5
    }));
};

const MetricModule = React.memo(({ title, value, subtext, icon: Icon, color, data, barColor }: any) => (
    <div className="relative group overflow-hidden bg-card/40 backdrop-blur-xl border border-border/40 rounded-sm p-5 transition-all duration-300 hover:bg-card/60 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
        {/* Elite Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[size:20px_20px] bg-grid-white/[0.2] z-0" />

        <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className={`w-0.5 h-3 ${barColor || 'bg-primary'} opacity-80 rounded-full shadow-[0_0_8px_var(--primary)]`} />
                    <h4 className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground/80 uppercase">{title}</h4>
                </div>
                <div className="text-4xl font-light tracking-tighter text-foreground/90">
                    {value}
                </div>
                <div className="text-[10px] text-muted-foreground/60 font-medium tracking-tight flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${barColor || 'bg-primary/40'} animate-pulse shadow-[0_0_5px_var(--primary)]`} />
                    {subtext}
                </div>
            </div>
            <div className="p-2.5 rounded-sm bg-foreground/[0.03] border border-border/20 shadow-inner transition-all group-hover:bg-primary/5 group-hover:border-primary/20">
                <Icon className={`w-4 h-4 ${color} opacity-80`} />
            </div>
        </div>

        {/* Elite Precision Sparkline */}
        <div className="h-10 mt-6 relative overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <Bar dataKey="value" radius={[1, 1, 0, 0]} isAnimationActive={false}>
                        {data.map((_: any, index: number) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === data.length - 1 ? (barColor || "var(--primary)") : "currentColor"}
                                className="text-muted-foreground/20"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
));

const ChannelModule = ({ channel }: any) => {
    const totalErrors = (channel.blackScreen || 0) + (channel.silence || 0);
    const isCritical = totalErrors > 50;
    const isWarning = totalErrors > 10;

    return (
        <div className="bg-card/30 backdrop-blur-md border border-border/40 p-4 flex flex-col justify-between transition-all hover:bg-card/50 relative overflow-hidden group">
            {/* Elite Corner Accent */}
            <div className={`absolute top-0 right-0 w-12 h-12 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary'}`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-primary/40 tracking-[0.3em] uppercase">HLS // UDP</span>
                    <span className="text-sm font-semibold text-foreground/80 uppercase tracking-tight block">{channel.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 border rounded-sm ${isCritical ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                        isWarning ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                            'border-primary/40 text-primary-foreground bg-primary/20'
                        }`}>
                        {isCritical ? 'CRITICAL' : isWarning ? 'ALERTA' : 'ESTABLE'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 relative z-10">
                <div className="bg-foreground/[0.03] p-2 rounded-sm border border-border/20 group-hover:bg-foreground/[0.05] transition-colors">
                    <div className="text-[14px] font-bold text-foreground/80">{(channel.blackScreen || 0).toString()}</div>
                    <div className="text-[7px] text-muted-foreground/40 tracking-widest uppercase mt-0.5">Video</div>
                </div>
                <div className="bg-foreground/[0.03] p-2 rounded-sm border border-border/20 group-hover:bg-foreground/[0.05] transition-colors">
                    <div className="text-[14px] font-bold text-foreground/80">{(channel.silence || 0).toString()}</div>
                    <div className="text-[7px] text-muted-foreground/40 tracking-widest uppercase mt-0.5">Audio</div>
                </div>
                <div className="bg-foreground/[0.03] p-2 rounded-sm border border-border/10 group-hover:bg-foreground/[0.05] transition-colors">
                    <div className="text-[14px] font-bold text-muted-foreground/40">{(totalErrors).toString()}</div>
                    <div className="text-[7px] text-muted-foreground/30 tracking-widest uppercase mt-0.5">Errores</div>
                </div>
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
        <div className="flex flex-col h-[85vh] bg-background text-foreground relative overflow-hidden font-['obviously-variable']">
            {/* Elite Command Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute inset-0 bg-grid-white/[0.015] bg-[size:32px_32px] pointer-events-none" />

            {/* Elite Header */}
            <div className="px-10 py-10 border-b border-border/40 flex justify-between items-center bg-card/20 backdrop-blur-xl relative z-10">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-sm shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" />
                                <span className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase">NOC ACTIVO</span>
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground/40 tracking-[0.2em] uppercase">Control Master // División LATAM</span>
                        </div>
                        <h1 className="text-5xl font-extralight tracking-tighter text-foreground/90">
                            sistema.<span className="text-primary/60 font-medium">estado_global</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-muted-foreground/50 font-bold tracking-[0.3em] uppercase">Integridad Global</span>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-light text-foreground/95 tracking-tighter">99.998<span className="text-primary/40 text-2xl font-bold ml-1">%</span></span>
                        </div>
                    </div>
                    <div className="h-16 w-[1px] bg-border/40" />
                    <div className="p-4 bg-primary/10 rounded-sm border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]">
                        <ShieldCheck className="w-8 h-8 text-primary opacity-80" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 relative z-10">
                {/* Metric Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <MetricModule
                        title="ACTIVIDAD"
                        value={`${stats.uptime}%`}
                        subtext="Núcleo de Red Estable"
                        icon={Zap}
                        color="text-primary"
                        data={trendData.active}
                        barColor="var(--primary)"
                    />
                    <MetricModule
                        title="SEÑALES"
                        value={`${stats.activeChannels}/${stats.totalChannels}`}
                        subtext="Sincronización Activa"
                        icon={Signal}
                        color="text-zinc-400"
                        data={trendData.active}
                        barColor="rgba(var(--foreground),0.2)"
                    />
                    <MetricModule
                        title="PÉRDIDA DE VIDEO"
                        value={stats.blackScreens}
                        subtext="Pantalla a Negro (24h)"
                        icon={AlertTriangle}
                        color="text-red-400"
                        data={trendData.videoLoss}
                        barColor="#ef4444"
                    />
                    <MetricModule
                        title="PÉRDIDA DE AUDIO"
                        value={stats.silenceEvents}
                        subtext="Silencio Detectado"
                        icon={VolumeX}
                        color="text-amber-400"
                        data={trendData.silence}
                        barColor="#f59e0b"
                    />
                </div>

                {/* Telemetry Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-primary/50 shadow-[0_0_8px_var(--primary)] rounded-full animate-pulse" />
                            <h2 className="text-[11px] font-black tracking-[0.4em] text-muted-foreground/60 uppercase">Matriz de Telemetría</h2>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-primary/40 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                            <div className="w-1 h-3 bg-primary/40 animate-bounce" /> Escaneando Transpondedores...
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {channelStats.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-card/20 h-32 animate-pulse rounded-sm border border-border/20" />
                            ))
                        ) : (
                            channelStats.map((channel) => (
                                <ChannelModule key={channel.name} channel={channel} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Elite Technical Footer */}
            <div className="px-10 py-5 bg-card/60 backdrop-blur-3xl border-t border-border/40 flex justify-between items-center text-[9px] font-bold text-muted-foreground/40 tracking-[0.2em] uppercase relative z-10">
                <div className="flex items-center gap-10">
                    <span className="flex items-center gap-2 group cursor-help"><div className="w-1 h-1 bg-primary/50 rounded-full group-hover:scale-150 transition-transform" /> HW: NOC-SVR-3000-ELITE</span>
                    <span className="flex items-center gap-2 group cursor-help"><div className="w-1 h-1 bg-border rounded-full group-hover:scale-150 transition-transform" /> NÚCLEO: v5.10.x // ESTABLE</span>
                    <span className="text-primary/60 font-black tracking-widest">SOCKET SEGURO ACTIVO // CRYPTO-PASS</span>
                </div>
                <div className="flex gap-10 items-center">
                    <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500/30 rounded-full animate-ping" /> SINC UDP: ACTIVA</span>
                    <span className="font-mono tracking-tighter opacity-80 border-l border-border/40 pl-10 text-[10px]">{new Date().toISOString()}</span>
                </div>
            </div>
        </div>
    );
}
