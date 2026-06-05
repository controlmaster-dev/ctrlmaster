import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function UsersTableRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-b border-border/40">
          <TableCell className="py-3 pl-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-5 w-16 rounded-sm" />
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-3 w-24" />
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-5 w-20 rounded-sm" />
          </TableCell>
          <TableCell className="py-3 pr-6 text-right">
            <Skeleton className="ml-auto h-8 w-8 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
