"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Home,
  Plus,
  Layout,
  Settings,
  LogOut,
  Command,
  Headset,
  MonitorPlay,
  Key,
  Ellipsis,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { CommandPalette } from "./CommandPalette";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { NavRouteIndicator } from "./NavRouteIndicator";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOGO_URL =
  "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openPalette, setOpenPalette] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isPath = (path: string) => pathname === path;

  const mainNav = [
    { href: "/", icon: Home, label: "Inicio", exact: true },
    { href: "/reportes", icon: Layout, label: "Reportes" },
    { href: "/claves", icon: Key, label: "Claves" },
  ];

  const secondaryLinks = [
    { href: "/operadores", icon: Headset, label: "Operadores", show: true },
    { href: "/operadores/monitoreo", icon: MonitorPlay, label: "Monitoreo", show: true },
  ];

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Command palette portal for mobile */}
      {mounted && isMobile && openPalette &&
        createPortal(
          <CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />,
          document.body
        )}

      {/* Desktop navbar */}
      <header className="sticky top-0 z-[100] hidden border-b border-border bg-background/80 backdrop-blur-xl md:block">
        <NavRouteIndicator pathname={pathname} />
        <div className="mx-auto flex h-14 max-w-[2200px] items-center gap-2 px-6">
          {/* Logo + brand */}
          <Link
            href="/"
            className="mr-6 flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <NextImage src={LOGO_URL} alt="Control Master" width={26} height={26} className="rounded object-contain" />
            <span className="text-[14px] font-bold tracking-tight text-foreground">
              Control Master
            </span>
          </Link>

          {/* Main navigation — clean pill-style */}
          {user && (
            <nav className="flex h-14 shrink-0 items-center gap-1" aria-label="Principal">
              {mainNav.map(({ href, icon: Icon, label, exact }) => {
                const active = exact ? isPath(href) : pathname.startsWith(href) && href !== "/";
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
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          {user && (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                className={cn(
                  "group flex h-9 w-[180px] lg:w-[220px] items-center gap-2 rounded-[2px] border border-border/80 bg-muted/20 px-3 text-[13px] text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/40 hover:text-foreground",
                  searchOpen && "hidden"
                )}
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">Buscar...</span>
                <kbd className="hidden h-5 items-center gap-0.5 rounded-[2px] border border-border/80 bg-background px-1.5 font-mono text-[9px] font-bold text-muted-foreground/80 sm:inline-flex">
                  ⌘K
                </kbd>
              </button>

              {searchOpen && (
                <div className="relative z-[101]">
                  <div className="flex h-9 w-[260px] lg:w-[300px] items-center gap-2 rounded-[2px] border border-border bg-card px-3 transition-all">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setOpenPalette(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.closest("[data-palette]")) {
                          setTimeout(() => { if (!document.activeElement?.closest("[data-palette]")) closeSearch(); }, 150);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") closeSearch();
                      }}
                      placeholder="Buscar reportes, operadores..."
                      className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="flex h-5 w-5 items-center justify-center rounded-[2px] text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {mounted && !isMobile && openPalette && (
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-[400px]" data-palette>
                      <CommandPalette
                        isOpen={openPalette}
                        onClose={closeSearch}
                        isIntegrated
                        externalQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CTA button */}
          {user && (
            <Link href="/crear-reporte" className="ml-1.5 hidden shrink-0 sm:block">
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-md bg-[#FF0C60] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#E00A54] transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Nuevo reporte
              </Button>
            </Link>
          )}

          {/* Secondary links dropdown */}
          {user && (
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
                <div className="h-0.5 w-full bg-gradient-to-r from-[#FF0C60] via-[#FF0C60]/50 to-transparent -mt-1 mb-1 shrink-0" />
                {secondaryLinks
                  .filter((l) => l.show)
                  .map(({ href, icon: Icon, label }) => {
                    const desc = label === "Operadores"
                      ? "Disponibilidad y turnos"
                      : label === "Monitoreo"
                      ? "Señales en tiempo real"
                      : "Ajustes y preferencias";
                    return (
                      <Link key={href} href={href}>
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-[#FF0C60] hover:bg-[#FF0C60]/8 focus:bg-[#FF0C60]/10 focus:text-foreground focus:border-l-[#FF0C60] pl-2.5 transition-all duration-150 group">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#FF0C60] group-focus:text-[#FF0C60] transition-colors" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground/90">{label}</span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 leading-none">{desc}</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user && <div className="mx-1.5 h-5 w-px bg-border" />}

          {/* Theme + user */}
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1.5 rounded-full outline-none transition-all duration-200 hover:opacity-80"
                  title={user?.name || "Mi cuenta"}
                >
                  <Avatar className="h-8 w-8 rounded-[2px] border border-border/60">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuario"} className="rounded-[2px]" />
                    <AvatarFallback className="rounded-[2px] bg-muted text-[11px] font-bold text-foreground">
                      {user?.name
                        ?.split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "CM"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 z-[10050] border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl p-1 rounded-[2px] overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-[#FF0C60] via-[#FF0C60]/50 to-transparent -mt-1 mb-1 shrink-0" />
                
                {/* Rich Header Card */}
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 bg-muted/10">
                  <Avatar className="h-10 w-10 rounded-[2px] border border-border/60 shrink-0">
                    <AvatarImage src={user?.avatar || ""} alt="" className="rounded-[2px]" />
                    <AvatarFallback className="rounded-[2px] bg-muted text-xs font-bold text-foreground">
                      {user?.name?.split(" ").filter(Boolean).map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "CM"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground leading-tight truncate">{user?.name || "Usuario"}</p>
                    <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-none">{user?.email}</p>
                    {user?.role && (
                      <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded-[2px] border border-[#FF0C60]/20 bg-[#FF0C60]/5 text-[8px] font-bold text-[#FF0C60] uppercase tracking-wider">
                        {user.role === "ENGINEER"
                          ? "Ingeniero"
                          : user.role === "ADMIN"
                          ? "Administrador"
                          : user.role === "BOSS"
                          ? "Con permisos de admin"
                          : user.role === "OPERATOR"
                          ? "Operador"
                          : user.role}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-0.5 space-y-0.5">
                  {user?.role !== "ENGINEER" && user?.role !== "OPERATOR" && (
                    <Link href="/configuracion">
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-2.5 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-[#FF0C60] hover:bg-[#FF0C60]/8 focus:bg-[#FF0C60]/10 focus:text-foreground focus:border-l-[#FF0C60] transition-all duration-150 group">
                        <Settings className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#FF0C60] group-focus:text-[#FF0C60] transition-colors" />
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
          ) : (
            <Link href="/login" className="ml-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-border bg-card px-4 text-[13px] font-semibold text-foreground hover:bg-muted"
              >
                Iniciar sesión
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile navbar */}
      {mounted &&
        createPortal(
          <>
            {/* Top bar */}
            <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-border bg-background/95 backdrop-blur-md md:hidden">
              <div className="flex h-14 items-center justify-between gap-3 px-4">
                <Link
                  href="/"
                  className="flex min-w-0 items-center gap-2 transition-colors"
                >
                  <NextImage src={LOGO_URL} alt="Logo" width={22} height={22} className="shrink-0 rounded object-contain" />
                  <span className="truncate text-[14px] font-bold tracking-tight">Control Master</span>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setOpenPalette(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-card text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      aria-label="Buscar"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                  <ThemeToggle />
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full outline-none"
                        >
                          <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarImage src={user?.avatar || ""} alt="" />
                            <AvatarFallback className="bg-muted text-[10px] font-bold">
                              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "CM"}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 z-[10050] border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl p-1 rounded-[2px] overflow-hidden">
                        <div className="h-0.5 w-full bg-gradient-to-r from-[#FF0C60] via-[#FF0C60]/50 to-transparent -mt-1 mb-1 shrink-0" />
                        <DropdownMenuLabel className="font-normal px-3 py-2">
                          <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-none">{user?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="opacity-40" />
                        {secondaryLinks.filter((l) => l.show).map(({ href, icon: Icon, label }) => {
                          const desc = label === "Operadores"
                            ? "Disponibilidad y turnos"
                            : "Señales en vivo";
                          return (
                            <Link key={href} href={href}>
                              <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-[#FF0C60] hover:bg-[#FF0C60]/8 focus:bg-[#FF0C60]/10 focus:text-foreground focus:border-l-[#FF0C60] pl-2.5 transition-all duration-150 group">
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#FF0C60] transition-colors" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-foreground/90">{label}</span>
                                  <span className="text-[9px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 leading-none">{desc}</span>
                                </div>
                              </DropdownMenuItem>
                            </Link>
                          );
                        })}
                        {user?.role !== "ENGINEER" && user?.role !== "OPERATOR" && (
                          <Link href="/configuracion">
                            <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-[#FF0C60] hover:bg-[#FF0C60]/8 focus:bg-[#FF0C60]/10 focus:text-foreground focus:border-l-[#FF0C60] pl-2.5 transition-all duration-150 group">
                              <Settings className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#FF0C60] transition-colors" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-foreground/90">Configuración</span>
                                <span className="text-[9px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 leading-none">Ajustes y preferencias</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        )}
                        <DropdownMenuSeparator className="opacity-40" />
                        <DropdownMenuItem 
                          className="cursor-pointer flex items-center gap-3 px-3 py-2 text-left rounded-[2px] border-l-[3px] border-l-transparent hover:border-l-red-500 hover:bg-red-500/[0.06] focus:bg-red-500/[0.08] focus:text-red-500 focus:border-l-red-500 transition-all duration-150 text-red-500 group"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4 shrink-0 text-red-400 group-hover:text-red-500 transition-colors" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold">Cerrar sesión</span>
                            <span className="text-[9px] text-red-400/80 group-hover:text-red-500/70 mt-0.5 leading-none">Salir de tu cuenta</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href="/login" className="ml-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Iniciar sesión
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </header>

            {/* Bottom tab bar */}
            {user && pathname !== "/crear-reporte" && (
              <nav
                className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 pb-safe backdrop-blur-md md:hidden"
                aria-label="Navegación móvil"
              >
                <div className="relative mx-auto flex h-[60px] max-w-lg items-stretch justify-between px-4">
                  {/* Left Side Links */}
                  <div className="flex flex-1 items-stretch justify-around">
                    {[
                      { href: "/", icon: Home, label: "Inicio", exact: true },
                      { href: "/reportes", icon: Layout, label: "Reportes" },
                    ].map(({ href, icon: Icon, label, exact }) => {
                      const active = exact ? isPath(href) : pathname.startsWith(href) && href !== "/";
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

                  {/* Central FAB */}
                  <div className="relative flex w-14 shrink-0 items-center justify-center">
                    <Link
                      href="/crear-reporte"
                      className="absolute -top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/20 transition-transform active:scale-95"
                      aria-label="Nuevo reporte"
                    >
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    </Link>
                  </div>

                  {/* Right Side Links */}
                  <div className="flex flex-1 items-stretch justify-around">
                    {[
                      { href: "/operadores/monitoreo", icon: MonitorPlay, label: "Monitoreo", exact: false },
                      { href: "/claves", icon: Key, label: "Claves", exact: false },
                    ].map(({ href, icon: Icon, label, exact }) => {
                      const active = exact ? isPath(href) : pathname.startsWith(href) && href !== "/";
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
                </div>
              </nav>
            )}
          </>,
          document.body
        )}
    </>
  );
}
