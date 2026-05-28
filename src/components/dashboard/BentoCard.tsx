"use client";

import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "accent" | "muted";
  as?: "div" | "section" | "article";
}

const variantClasses: Record<string, string> = {
  default:
    "border border-border/80 bg-card",
  elevated:
    "border border-border bg-card/90",
  accent:
    "border border-[#FF0C60]/20 bg-[#FF0C60]/[0.04] dark:bg-[#FF0C60]/[0.03]",
  muted:
    "border border-border/80 bg-muted/60",
};

export function BentoCard({
  children,
  className,
  variant = "default",
  as: Component = "div",
}: BentoCardProps) {
  return (
    <Component
      className={cn(
        "rounded-[6px] transition-all duration-300 hover:border-foreground/15 dark:hover:border-foreground/20",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}
