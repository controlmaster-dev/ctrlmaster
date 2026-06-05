import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isRouteActive,
  mobileLeftLinks,
  mobileRightLinks,
  type NavLinkConfig,
} from "@/components/navbar/navConfig";

type MobileBottomNavProps = {
  pathname: string;
};

function MobileLinkGroup({ pathname, links }: { pathname: string; links: NavLinkConfig[] }) {
  return (
    <div className="flex flex-1 items-stretch justify-around">
      {links.map(({ href, icon: Icon, label, exact }) => {
        const active = isRouteActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors w-14",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-[2px] transition-colors",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  if (pathname === "/crear-reporte") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 pb-safe backdrop-blur-md md:hidden"
      aria-label="Navegación móvil"
    >
      <div className="relative mx-auto flex h-[60px] max-w-lg items-stretch justify-between px-4">
        <MobileLinkGroup pathname={pathname} links={mobileLeftLinks} />
        <div className="relative flex w-14 shrink-0 items-center justify-center">
          <Link
            href="/crear-reporte"
            className="absolute -top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-brand text-white shadow-lg shadow-brand/20 transition-transform active:scale-95"
            aria-label="Nuevo reporte"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </Link>
        </div>
        <MobileLinkGroup pathname={pathname} links={mobileRightLinks} />
      </div>
    </nav>
  );
}
