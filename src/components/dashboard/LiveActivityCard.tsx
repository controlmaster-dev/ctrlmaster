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
  const recentCommentsList = comments.slice(0, 2);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl border transition-all duration-300 hover:border-[#FF0C60]/30 rounded-2xl overflow-hidden shadow-sm group h-full">
      <CardContent className="p-4 md:p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="p-2 rounded-md bg-[#FF0C60]/10 text-[#FF0C60]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0C60] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0C60]"></span>
          </span>
        </div>
        <div className="space-y-3 flex-1 min-w-0 flex flex-col overflow-hidden">
          <p className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2 shrink-0">Comentarios recientes</p>
          {loading ? (
            <div className="space-y-4">
              <div className="space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-8 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-8 w-full" /></div>
            </div>
          ) : recentCommentsList.length > 0 ? (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-2">
              {recentCommentsList.map((comment) => (
                <div key={comment.id} className="space-y-2 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {comment.author?.name?.[0]}
                    </div>
                    <span className="text-[12px] font-medium text-foreground truncate">
                      {comment.author?.name.split(' ')[0]} comentó:
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed pl-7">
                    "{comment.content}"
                  </p>
                  <div className="flex items-center justify-between pt-1 pl-7">
                    <span className="text-[10px] text-slate-500 font-medium">#{comment.report?.id?.slice(0, 6)}</span>
                    <Link href={`/reportes?reportId=${comment.report?.id}`} className="text-[10px] text-[#FF0C60] font-semibold hover:underline">
                      Ver reporte
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic flex-1">Sin actividad reciente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
