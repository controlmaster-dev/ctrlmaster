import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyTrendChartProps {
  loading: boolean;
  chartData: {
    labels: string[];
    values: number[];
  };
}

export function WeeklyTrendChart({ loading, chartData }: WeeklyTrendChartProps) {
  const { fillPath, linePath } = useMemo(() => {
    if (!chartData.values || chartData.values.length < 2) return { fillPath: '', linePath: '' };
    const max = Math.max(...chartData.values, 5);
    const xStep = 100 / (chartData.values.length - 1);
    const pointsArray = chartData.values.map((val, i) => {
      const x = i * xStep;
      const y = 90 - (val / max) * 80;
      return `${x},${y}`;
    });
    const points = pointsArray.join(' ');
    const fillPath = `M 0,100 ${points} L 100,100 Z`;
    const linePath = `M ${pointsArray[0]} L ${pointsArray.slice(1).join(' L ')}`;
    return { fillPath, linePath };
  }, [chartData.values]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-end justify-between gap-2">
        {Array(7).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-full bg-muted rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
        ))}
      </div>
    );
  }

  if (chartData.values.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm">No hay datos suficientes</div>;
  }

  return (
    <>
      <div className="absolute inset-x-4 top-4 bottom-10">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#lineGradient)" />
          <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {chartData.values.map((val, i) => {
          const max = Math.max(...chartData.values, 5);
          const xPercent = (i / (chartData.values.length - 1)) * 100;
          const yPercent = 90 - (val / max) * 80;

          return (
            <div
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 group/point flex items-center justify-center cursor-pointer"
              style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
            >
              <div className="absolute inset-0 rounded-full bg-transparent hover:bg-cyan-500/10 transition-colors" />
              <div className="w-2 h-2 rounded-full bg-background border-2 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] group-hover/point:scale-150 transition-transform" />
              <div className="absolute bottom-full mb-2 bg-card text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {val}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] font-semibold text-muted-foreground">
        {chartData.labels.map((l, i) => (
          <div key={i} className="w-8 text-center">{l}</div>
        ))}
      </div>
    </>
  );
}
