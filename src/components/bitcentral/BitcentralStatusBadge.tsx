import type { BitcentralDisplayInfo } from "@/components/bitcentral/bitcentralUtils";

type BitcentralStatusBadgeProps = {
  info: Pick<BitcentralDisplayInfo, "isOverride" | "isRotation">;
};

export function BitcentralStatusBadge({ info }: BitcentralStatusBadgeProps) {
  if (info.isOverride) {
    return (
      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        Cambio manual
      </span>
    );
  }

  if (info.isRotation) {
    return (
      <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
        Rotativo
      </span>
    );
  }

  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      Regular
    </span>
  );
}
