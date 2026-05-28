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
    { href: "/configuracion", icon: Settings, label: "Configuración", show: user?.role !== "ENGINEER" },
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
              className={cn(
                "group flex h-9 w-[180px] lg:w-[220px] items-center gap-2 rounded-md border border-border/80 bg-muted/20 px-3 text-[13px] text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/40 hover:text-foreground",
                searchOpen && "hidden"
              )}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="hidden h-5 items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[9px] font-bold text-muted-foreground/80 sm:inline-flex">
                ⌘K
              </kbd>
            </button>

            {searchOpen && (
              <div className="relative z-[101]">
                <div className="flex h-9 w-[260px] lg:w-[300px] items-center gap-2 rounded-md border border-border bg-card px-3 transition-all">
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
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
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

          {/* CTA button */}
          <Link href="/crear-reporte" className="ml-1.5 hidden shrink-0 sm:block">
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-md bg-[#FF0C60] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#E00A54] transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Nuevo reporte
            </Button>
          </Link>

          {/* Secondary links dropdown */}
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
            <DropdownMenuContent align="end" className="w-48 z-[10050] border-border bg-popover text-popover-foreground">
              {secondaryLinks
                .filter((l) => l.show)
                .map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}>
                    <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs font-medium">
                      <Icon className="h-4 w-4" />
                      {label}
                    </DropdownMenuItem>
                  </Link>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1.5 h-5 w-px bg-border" />

          {/* Theme + user */}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1.5 rounded-full outline-none transition-all duration-200 hover:opacity-80"
                title={user?.name || "Mi cuenta"}
              >
                <Avatar className="h-8 w-8 border border-border/60">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuario"} />
                  <AvatarFallback className="bg-muted text-[11px] font-bold text-foreground">
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
            <DropdownMenuContent align="end" className="w-52 z-[10050] border-border bg-popover text-popover-foreground">
              <DropdownMenuLabel className="font-normal px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{user?.name || "Usuario"}</p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role !== "ENGINEER" && (
                <Link href="/configuracion">
                  <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs font-medium">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs font-medium text-red-500 focus:text-red-500" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <button
                    type="button"
                    onClick={() => setOpenPalette(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-card text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    aria-label="Buscar"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <ThemeToggle />
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
                    <DropdownMenuContent align="end" className="w-52 z-[10050] border-border bg-popover text-popover-foreground">
                      <DropdownMenuLabel className="font-normal px-3 py-2.5">
                        <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {secondaryLinks.filter((l) => l.show).map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href}>
                          <DropdownMenuItem className="gap-2.5 text-xs font-medium">
                            <Icon className="h-4 w-4" /> {label}
                          </DropdownMenuItem>
                        </Link>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2.5 text-xs font-medium text-red-500 focus:text-red-500" onClick={logout}>
                        <LogOut className="h-4 w-4" /> Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Bottom tab bar */}
            {pathname !== "/crear-reporte" && (
              <nav
                className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 pb-safe backdrop-blur-md md:hidden"
                aria-label="Navegación móvil"
              >
                <div className="relative mx-auto flex h-[60px] max-w-lg items-stretch justify-around px-2">
                  {mainNav.map(({ href, icon: Icon, label, exact }) => {
                    const active = exact ? isPath(href) : pathname.startsWith(href) && href !== "/";
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-14 items-center justify-center rounded-md transition-colors",
                            active && "bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {label}
                      </Link>
                    );
                  })}

                  {/* Central FAB */}
                  <div className="relative flex w-14 shrink-0 items-center justify-center">
                    <Link
                      href="/crear-reporte"
                      className="absolute -top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-[#FF0C60] text-white transition-transform active:scale-95"
                      aria-label="Nuevo reporte"
                    >
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    </Link>
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
