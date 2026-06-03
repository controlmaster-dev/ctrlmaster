import Link from "next/link";
import { ClipboardList, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, getRoleLabel } from "@/components/navbar/navConfig";

type NavbarUser = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: string | null;
};

type UserAccountMenuProps = {
  user: NavbarUser;
  logout: () => void;
  mobile?: boolean;
};

export function UserAccountMenu({ user, logout, mobile = false }: UserAccountMenuProps) {
  const canOpenSettings = user.role !== "ENGINEER" && user.role !== "OPERATOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={mobile ? "rounded-full outline-none" : "ml-1.5 rounded-full outline-none transition-all duration-200 hover:opacity-80"}
          title={user.name || "Mi cuenta"}
        >
          <Avatar className={mobile ? "h-8 w-8 border border-border/60" : "h-8 w-8 rounded-[2px] border border-border/60"}>
            <AvatarImage src={user.avatar || ""} alt={user.name || "Usuario"} className={mobile ? undefined : "rounded-[2px]"} />
            <AvatarFallback className={mobile ? "bg-muted text-[10px] font-bold" : "rounded-[2px] bg-muted text-[11px] font-bold text-foreground"}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 z-[10050] border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl p-1 rounded-[2px] overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-brand via-brand/50 to-transparent -mt-1 mb-1 shrink-0" />
        {mobile ? (
          <>
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-none">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-40" />
          </>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 bg-muted/10">
            <Avatar className="h-10 w-10 rounded-[2px] border border-border/60 shrink-0">
              <AvatarImage src={user.avatar || ""} alt="" className="rounded-[2px]" />
              <AvatarFallback className="rounded-[2px] bg-muted text-xs font-bold text-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-tight truncate">{user.name || "Usuario"}</p>
              <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-none">{user.email}</p>
              {user.role && (
                <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded-[2px] border border-brand/20 bg-brand/5 text-[8px] font-bold text-brand uppercase tracking-wider">
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="p-0.5 space-y-0.5">
          <Link href="/diarios">
            <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-2.5 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-brand hover:bg-brand/8 focus:bg-brand/10 focus:text-foreground focus:border-l-brand transition-all duration-150 group">
              <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand group-focus:text-brand transition-colors" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground/90">Diarios</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                  Funciones del operador
                </span>
              </div>
            </DropdownMenuItem>
          </Link>
          {canOpenSettings && (
            <Link href="/configuracion">
              <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-2.5 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-brand hover:bg-brand/8 focus:bg-brand/10 focus:text-foreground focus:border-l-brand transition-all duration-150 group">
                <Settings className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand group-focus:text-brand transition-colors" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground/90">Configuración</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 leading-none">Ajustes y preferencias</span>
                </div>
              </DropdownMenuItem>
            </Link>
          )}
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-3 px-2.5 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-red-500 hover:bg-red-500/[0.06] focus:bg-red-500/[0.08] focus:text-red-500 focus:border-l-red-500 transition-all duration-150 text-red-500 group"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-400 group-hover:text-red-500 group-focus:text-red-500 transition-colors" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold">Cerrar sesión</span>
              <span className="text-[10px] text-red-400/80 group-hover:text-red-500/70 mt-0.5 leading-none">Salir de tu cuenta</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
