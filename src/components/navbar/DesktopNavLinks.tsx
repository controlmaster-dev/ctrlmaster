import Link from "next/link";
import { cn } from "@/lib/utils";
import { isRouteActive, mainNav } from "@/components/navbar/navConfig";

type DesktopNavLinksProps = {
  pathname: string;
};

export function DesktopNavLinks({ pathname }: DesktopNavLinksProps) {
  return (
    <nav className="flex h-14 shrink-0 items-center gap-1" aria-label="Principal">
      {mainNav.map(({ href, icon: Icon, label, exact }) => {
        const active = isRouteActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex h-9 items-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-all duration-200",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
