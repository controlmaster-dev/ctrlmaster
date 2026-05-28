import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardSectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardSectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  contentClassName,
}: DashboardSectionCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[6px] border border-border bg-card",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/50 px-4 py-3.5 md:px-5">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold md:text-base">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-background ring-1 ring-border/60">
                {icon}
              </span>
            )}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="mt-1 text-[11px] md:text-xs">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
