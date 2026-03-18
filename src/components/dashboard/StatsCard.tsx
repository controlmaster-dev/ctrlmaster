import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatsCard({ title, value, subtitle, icon, valueColor = "text-foreground", variant = 'default' }: StatsCardProps) {
  const variants = {
    default: "border-blue-500/30 bg-blue-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-orange-500/30 bg-orange-500/5",
    danger: "border-rose-500/30 bg-rose-500/5"
  };
  
  const iconColors = {
    default: "text-blue-500 bg-blue-500/10",
    success: "text-emerald-500 bg-emerald-500/10",
    warning: "text-orange-500 bg-orange-500/10",
    danger: "text-rose-500 bg-rose-500/10"
  };

  return (
    <Card className={`${variants[variant]} backdrop-blur-sm border transition-all duration-200 hover:border-opacity-50 rounded-md overflow-hidden`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-md ${iconColors[variant]}`}>
            {icon}
          </div>
          {variant === 'danger' && value > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground tracking-tight">{title}</p>
          <h3 className={`text-2xl md:text-3xl font-bold ${valueColor}`}>{value}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
