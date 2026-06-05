import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { prefetchReportDetail } from "@/lib/reportDetailCache";

interface CommentAuthor {
  name?: string;
}

interface CommentItem {
  id: string;
  content: string;
  author?: CommentAuthor;
  report?: { id?: string; problemDescription?: string };
}

interface LiveActivityCardProps {
  comments: CommentItem[];
  loading: boolean;

  onReportClick?: (
    reportId: string,
    hint?: { problemDescription?: string }
  ) => void;
}

function authorInitials(name?: string) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function LiveActivityCard({
  comments,
  loading,
  onReportClick,
}: LiveActivityCardProps) {
  const recentComments = comments.slice(0, 3);

  return (
    <Card className="overflow-hidden rounded-none border-0 bg-transparent shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/40 bg-muted/15 px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">Comentarios recientes</CardTitle>
          <CardDescription className="mt-0.5 text-[11px]">
            Actividad en reportes
          </CardDescription>
        </div>
        <Link href="/reportes" className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-brand hover:bg-brand/10 hover:text-brand"
          >
            Ver todos
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="divide-y divide-border/40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-sm" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-full rounded-sm" />
              </div>
            ))}
          </div>
        ) : recentComments.length > 0 ? (
          <ul className="divide-y divide-border/40">
            {recentComments.map((comment) => {
              const reportId = comment.report?.id;
              const rowClass =
                "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/30";

              const inner = (
                <>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted/50 text-[10px] font-bold text-muted-foreground">
                      {authorInitials(comment.author?.name)}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                      {comment.author?.name?.split(" ")[0] ?? "Operador"}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      #{reportId?.slice(0, 6) ?? "—"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {comment.content}
                  </p>
                </>
              );

              if (onReportClick && reportId) {
                return (
                  <li key={comment.id}>
                    <button
                      type="button"
                      className={rowClass}
                      onMouseEnter={() => prefetchReportDetail(reportId)}
                      onClick={() =>
                        onReportClick(reportId, {
                          problemDescription: comment.report?.problemDescription,
                        })
                      }
                    >
                      {inner}
                    </button>
                  </li>
                );
              }

              return (
                <li key={comment.id}>
                  <Link href={`/reportes?reportId=${reportId ?? ""}`} className={rowClass}>
                    {inner}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            No hay comentarios recientes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
