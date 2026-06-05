import { cn } from "@/lib/utils";

type SkeletonVariant = "wave" | "pulse";

function Skeleton({
  className,
  variant = "wave",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: SkeletonVariant }) {
  const base = "relative overflow-hidden rounded-md bg-muted";
  const variantClass =
    variant === "pulse" ? "animate-pulse" : "skeleton-wave";

  return (
    <div
      className={cn(base, variantClass, className)}
      {...props}
    />
  );
}

export { Skeleton };