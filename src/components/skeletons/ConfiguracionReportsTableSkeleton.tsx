import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BentoCard } from "@/components/dashboard/BentoCard";

export function ConfiguracionReportsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <BentoCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/80 p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-full md:max-w-xs" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="border-border/80 hover:bg-transparent">
              <TableHead className="pl-5">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-24" />
              </TableHead>
              <TableHead className="pr-5 text-right">
                <Skeleton className="ml-auto h-3 w-10" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i} className="border-border/60">
                <TableCell className="pl-5">
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-full max-w-md" />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Skeleton className="ml-auto h-8 w-8 rounded-sm" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </BentoCard>
  );
}
