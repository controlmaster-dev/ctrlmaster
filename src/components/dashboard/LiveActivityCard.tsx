import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface LiveActivityCardProps {
  comments: any[];
  loading: boolean;
}

export function LiveActivityCard({ comments, loading }: LiveActivityCardProps) {
  const latestComment = comments[0];

  return (
    <Card className="border-border bg-card/40 backdrop-blur-sm border transition-all duration-300 hover:border-[#FF0C60]/30 rounded-md overflow-hidden group">
      <CardContent className="p-4 md:p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-md bg-[#FF0C60]/10 text-[#FF0C60]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0C60] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0C60]"></span>
          </span>
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-2">Comentarios recientes</p>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : latestComment ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                  {latestComment.author?.name?.[0]}
                </div>
                <span className="text-[11px] font-medium text-foreground truncate">
                  {latestComment.author?.name.split(' ')[0]} comentó:
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                "{latestComment.content}"
              </p>
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[9px] text-slate-500 font-medium">#{latestComment.report?.id?.slice(0, 6)}</span>
                <Link href={`/reportes`} className="text-[9px] text-[#FF0C60] font-semibold hover:underline">
                  Ver reporte
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin actividad reciente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
