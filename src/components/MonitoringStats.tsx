"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Activity, Signal, VolumeX } from "lucide-react";

interface Stats {
    uptime: number;
    blackScreens: number;
    silenceEvents: number;
    totalChannels: number;
    activeChannels: number;
}

// Mock data for the sparklines
const generateSparklineData = (count: number) => {
    return Array.from({ length: 12 }, (_, i) => ({
        name: i.toString(),
        value: Math.floor(Math.random() * (count + 10)) + 2
    }));
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

    // Stable mock data initialized once
    const [trendData] = useState(() => ({
        active: generateSparklineData(20),
        videoLoss: generateSparklineData(2),
        silence: generateSparklineData(5)
    }));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/streams/stats');
                if (res.ok) {
                    const data = await res.json();
                    let blackCtx = 0;
                    let silenceCtx = 0;

                    // Data is already unique per channel from API: { name, errors, blackScreen, silence }
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

    const MetricCard = ({ title, value, subtext, icon: Icon, color, data, barColor }: any) => (
        <div className={`bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border-white/5 shadow-lg transition-all duration-300 group relative overflow-hidden rounded-2xl border hover:-translate-y-1 ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex flex-col justify-between h-40`}>
            {/* Glow Effect from StatsCard */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-2 p-4 pb-0 z-10 relative">
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{title}</h4>
                    <div className="text-3xl font-black tracking-tight text-white">{value}</div>
                    <div className="text-[10px] font-medium text-zinc-400 mt-1 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block group-hover:bg-[#FF0C60] transition-colors shrink-0 ${color.replace('text-', 'bg-')}`} />
                        {subtext}
                    </div>
                </div>
                <div className={`p-2 rounded-xl bg-white/5 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
            </div>

            {/* Mini Chart */}
            <div className={`flex-1 w-full h-full min-h-[40px] opacity-60 px-4 pb-2 z-10 relative`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                            {data.map((_: any, index: any) => (
                                <Cell key={`cell-${index}`} fill={barColor || (index % 2 === 0 ? "#52525b" : "#3f3f46")} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 w-full">
            {/* Global Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <MetricCard
                    title="Estado Global"
                    value={stats.blackScreens === 0 ? "Normal" : "Alerta"}
                    subtext="Uptime Promedio"
                    icon={Activity}
                    color="text-emerald-500"
                    data={trendData.active}
                    barColor="#10b981"
                />
                <MetricCard
                    title="Canales Activos"
                    value={`${stats.activeChannels}/${stats.totalChannels}`}
                    subtext="En transmisión"
                    icon={Signal}
                    color="text-blue-500"
                    data={trendData.active}
                    barColor="#3b82f6"
                />
                <MetricCard
                    title="Pérdida de Video"
                    value={stats.blackScreens}
                    subtext="Eventos (24h)"
                    icon={AlertTriangle}
                    color="text-red-500"
                    data={trendData.videoLoss}
                    barColor="#ef4444"
                />
                <MetricCard
                    title="Alertas Silencio"
                    value={stats.silenceEvents}
                    subtext="Eventos (24h)"
                    icon={VolumeX}
                    color="text-amber-500"
                    data={trendData.silence}
                    barColor="#f59e0b"
                />
            </div>

            {/* Detailed Channel List */}
            <div className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Detalle por Canal</h3>
                    <div className="text-xs text-zinc-500">Últimas 24 horas</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="text-xs uppercase bg-black/20 text-zinc-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Canal</th>
                                <th className="px-6 py-3 font-semibold text-center">Estado</th>
                                <th className="px-6 py-3 font-semibold text-right">Pérdida de Video</th>
                                <th className="px-6 py-3 font-semibold text-right">Silencios</th>
                                <th className="px-6 py-3 font-semibold text-right">Total Eventos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {channelStats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-600 italic">
                                        Esperando datos...
                                    </td>
                                </tr>
                            ) : (
                                channelStats.map((channel) => {
                                    const totalErrors = (channel.blackScreen || 0) + (channel.silence || 0);
                                    let statusColor = "bg-emerald-500";
                                    let statusText = "Estable";

                                    if (totalErrors > 50) {
                                        statusColor = "bg-red-500";
                                        statusText = "Crítico";
                                    } else if (totalErrors > 10) {
                                        statusColor = "bg-amber-500";
                                        statusText = "Advertencia";
                                    }

                                    return (
                                        <tr key={channel.name} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                {channel.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${statusColor} bg-opacity-20 border border-white/10`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`${channel.blackScreen > 0 ? 'text-red-400 font-bold' : ''}`}>
                                                    {channel.blackScreen || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`${channel.silence > 0 ? 'text-amber-400 font-bold' : ''}`}>
                                                    {channel.silence || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-white/50 group-hover:text-white transition-colors">
                                                {totalErrors}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
