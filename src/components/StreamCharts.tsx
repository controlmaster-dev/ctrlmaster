"use client";

import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface ChartData {
    name: string;
    errors: number;
    blackScreen: number;
    silence: number;
}

export function StreamCharts() {
    const [data, setData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/streams/stats');
            if (response.ok) {
                const result = await response.json();
                // If no data, fallback to initial structure with 0s for all known channels
                if (result.length === 0) {
                    const initialData = [
                        { name: "Enlace TV", errors: 0, blackScreen: 0, silence: 0 },
                        { name: "Planeta C.", errors: 0, blackScreen: 0, silence: 0 }, // Shortened names for mobile
                        { name: "EJTV", errors: 0, blackScreen: 0, silence: 0 },
                        { name: "En Concierto", errors: 0, blackScreen: 0, silence: 0 },
                        { name: "Evangelios", errors: 0, blackScreen: 0, silence: 0 },
                        { name: "A. Alducin", errors: 0, blackScreen: 0, silence: 0 },
                        { name: "Mujeres Fe", errors: 0, blackScreen: 0, silence: 0 },
                    ];
                    setData(initialData);
                } else {
                    setData(result);
                }
            }
        } catch (error) {
            console.error("Failed to fetch chart data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading && data.length === 0) {
        return (
            <div className="w-full h-[300px] border border-border/50 rounded-lg p-6 mt-8 flex items-center justify-center bg-card">
                <span className="text-muted-foreground text-sm">Cargando métricas...</span>
            </div>
        )
    }

    return (
        <div className="w-full bg-card border border-border/50 rounded-xl p-6 mt-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Reporte de Calidad (24h)</h3>
                    <p className="text-muted-foreground text-xs mt-1">Incidentes detectados automáticamente</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.7 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.7 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            labelStyle={{ fontWeight: 600, marginBottom: '8px', color: 'var(--foreground)' }}
                            itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', opacity: 0.8 }}
                        />
                        <Bar
                            dataKey="blackScreen"
                            name="Pantalla Negra"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="silence"
                            name="Silencio"
                            fill="#eab308"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="errors"
                            name="Errores"
                            fill="#71717a"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
