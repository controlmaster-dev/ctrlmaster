import Link from "next/link";
import { Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLinkDescription, secondaryLinks } from "@/components/navbar/navConfig";

export function DesktopMoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          title="Más opciones"
        >
          <Ellipsis className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[10050] border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl p-1 rounded-[2px] overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-brand via-brand/50 to-transparent -mt-1 mb-1 shrink-0" />
        {secondaryLinks
          .filter((item) => item.show)
          .map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-brand hover:bg-brand/8 focus:bg-brand/10 focus:text-foreground focus:border-l-brand pl-2.5 transition-all duration-150 group">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand group-focus:text-brand transition-colors" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground/90">{label}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 leading-none">
                    {getLinkDescription(label)}
                  </span>
                </div>
              </DropdownMenuItem>
            </Link>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
