import { Skeleton } from "@/components/ui/skeleton";

export function LoginSkeleton() {
  return (
    <div className="flex min-h-screen flex-col text-foreground selection:bg-[#FF0C60] selection:text-white lg:flex-row">
      <section className="relative hidden min-h-screen flex-col justify-center overflow-hidden bg-muted/20 p-14 lg:flex lg:w-[44%]">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#FF0C60]/15 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative z-10">
          <Skeleton className="mb-6 h-12 w-12 rounded-xl" />
          <Skeleton className="h-9 w-52 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-36 rounded-md" />
        </div>
      </section>

      <section className="flex flex-1 flex-col justify-center bg-background px-6 py-10 sm:px-12 lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-40 rounded-md" />
          </div>

          <div className="mb-8 flex rounded-xl border border-border/60 bg-muted/25 p-1">
            <div className="flex-1 py-2.5 text-center">
              <Skeleton className="mx-auto h-4 w-20 rounded-md" />
            </div>
            <div className="flex-1 py-2.5 text-center">
              <Skeleton className="mx-auto h-4 w-20 rounded-md" />
            </div>
          </div>

          <Skeleton className="mb-2 h-7 w-44 rounded-md" />
          <Skeleton className="mb-6 h-4 w-64 max-w-full rounded-md" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
