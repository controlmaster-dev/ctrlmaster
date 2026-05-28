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
  Menu,
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
        if (!isMobile) {
          searchInputRef.current?.focus();
          setOpenPalette(true);
        } else {
          setOpenPalette((curr) => !curr);
        }
      }
    },
    [isMobile]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isPath = (path: string) => pathname === path;
  const isOperadores =
    pathname.startsWith("/operadores") && pathname !== "/operadores/monitoreo";

  const navTabClass = (active: boolean) =>
    cn(
      "relative flex h-14 items-center gap-2 px-4 text-sm font-medium transition-colors",
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    );

  const iconBtnClass = (active: boolean) =>
    cn(
      "h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      active && "bg-muted/80 text-foreground"
    );

  const mainNav = [
    { href: "/", icon: Home, label: "Inicio", active: isPath("/") },
    { href: "/reportes", icon: Layout, label: "Reportes", active: isPath("/reportes") },
    { href: "/claves", icon: Key, label: "Claves", active: isPath("/claves") },
  ];

  const closePalette = () => {
    setOpenPalette(false);
    searchInputRef.current?.blur();
    setSearchQuery("");
  };

  return (
    <>
      {mounted && isMobile && openPalette &&
        createPortal(
          <CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />,
          document.body
        )}

      {/* Desktop */}
      <header className="sticky top-0 z-[100] hidden border-b border-border bg-background/95 backdrop-blur-md md:block">
        <NavRouteIndicator pathname={pathname} />
        <div className="mx-auto flex h-14 max-w-[2200px] items-center gap-3 px-4 lg:gap-5 lg:px-6">
          <Link href="/" className="mr-1 flex shrink-0 items-center gap-2.5 hover:opacity-90">
            <NextImage src={LOGO_URL} alt="Control Master" width={28} height={28} className="object-contain" />
            <span className="hidden font-semibold tracking-tight text-foreground lg:inline">
              Control Master
            </span>
          </Link>

          <nav className="hidden h-14 shrink-0 items-stretch md:flex" aria-label="Principal">
            {mainNav.map(({ href, icon: Icon, label, active }) => (
              <Link key={href} href={href} className={navTabClass(active)}>
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span>{label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#FF0C60]"
                    aria-hidden
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="mx-2 hidden h-6 w-px shrink-0 bg-border md:block" />

          {/* Búsqueda */}
          <div
            className={cn(
              "relative min-w-0 flex-1 px-2 lg:max-w-xl lg:px-0 xl:max-w-2xl",
              openPalette && "z-[100]"
            )}
          >
            <div
              className={cn(
                "relative z-[101] flex h-10 w-full items-center gap-2 border bg-muted/30 transition-shadow",
                openPalette
                  ? "rounded-t-lg rounded-b-none border-border bg-card shadow-sm ring-1 ring-border/80"
                  : "rounded-lg border-border/70 hover:border-border hover:bg-muted/40"
              )}
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setOpenPalette(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closePalette();
                }}
                placeholder="Buscar…"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              {!openPalette && (
                <kbd className="mr-2.5 hidden h-6 items-center gap-1 rounded border border-border/70 bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
                  <Command className="h-3 w-3" />K
                </kbd>
              )}
            </div>

            {mounted && !isMobile && openPalette && (
              <div className="absolute left-0 right-0 top-full z-50 -mt-px">
                <CommandPalette
                  isOpen={openPalette}
                  onClose={closePalette}
                  isIntegrated
                  externalQuery={searchQuery}
                  onQueryChange={setSearchQuery}
                />
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/crear-reporte" className="hidden shrink-0 sm:block">
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-md bg-[#FF0C60] px-3.5 text-xs font-semibold text-white hover:bg-[#E00A54]"
              >
                <Plus className="h-4 w-4" />
                Nuevo reporte
              </Button>
            </Link>

            <div className="hidden items-center gap-0.5 sm:flex">
              {user?.role !== "ENGINEER" && (
                <Link href="/configuracion">
                  <Button variant="ghost" size="icon" className={iconBtnClass(isPath("/configuracion"))} title="Configuración">
                    <Settings className="h-[18px] w-[18px]" />
                  </Button>
                </Link>
              )}
              <Link href="/operadores/monitoreo">
                <Button variant="ghost" size="icon" className={iconBtnClass(isPath("/operadores/monitoreo"))} title="Monitoreo">
                  <MonitorPlay className="h-[18px] w-[18px]" />
                </Button>
              </Link>
              <Link href="/operadores">
                <Button variant="ghost" size="icon" className={iconBtnClass(isOperadores)} title="Operadores">
                  <Headset className="h-[18px] w-[18px]" />
                </Button>
              </Link>
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border/80 sm:block" />

            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  title={user?.name || "Mi cuenta"}
                >
                  <Avatar className="h-9 w-9 border border-border/80">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuario"} />
                    <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
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
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role !== "ENGINEER" && (
                  <Link href="/configuracion">
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <Settings className="h-4 w-4" />
                      Configuración
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile */}
      {mounted &&
        createPortal(
          <>
            <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-border/80 bg-background/90 backdrop-blur-md md:hidden">
              <div className="flex h-14 items-center justify-between gap-3 px-4">
                <Link href="/" className="flex min-w-0 items-center gap-2">
                  <NextImage src={LOGO_URL} alt="Logo" width={28} height={28} className="shrink-0 object-contain" />
                  <span className="truncate text-sm font-semibold tracking-tight">Control Master</span>
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOpenPalette(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    aria-label="Buscar"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="rounded-full outline-none">
                        <Avatar className="h-9 w-9 border border-border/80">
                          <AvatarImage src={user?.avatar || ""} alt="" />
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "CM"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user?.role !== "ENGINEER" && (
                        <Link href="/configuracion">
                          <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" /> Configuración
                          </DropdownMenuItem>
                        </Link>
                      )}
                      <Link href="/operadores">
                        <DropdownMenuItem className="gap-2">
                          <Headset className="h-4 w-4" /> Operadores
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/operadores/monitoreo">
                        <DropdownMenuItem className="gap-2">
                          <MonitorPlay className="h-4 w-4" /> Monitoreo
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2" onClick={logout}>
                        <LogOut className="h-4 w-4" /> Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {pathname !== "/crear-reporte" && (
              <nav
                className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border/80 bg-background/95 pb-safe backdrop-blur-md md:hidden"
                aria-label="Navegación móvil"
              >
                <div className="relative mx-auto flex h-[60px] max-w-lg items-stretch justify-around px-2">
                  <Link
                    href="/"
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                      isPath("/") ? "text-[#FF0C60]" : "text-muted-foreground"
                    )}
                  >
                    <Home className="h-5 w-5" />
                    Inicio
                  </Link>
                  <Link
                    href="/reportes"
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                      isPath("/reportes") ? "text-[#FF0C60]" : "text-muted-foreground"
                    )}
                  >
                    <Layout className="h-5 w-5" />
                    Reportes
                  </Link>

                  <div className="relative flex w-14 shrink-0 items-center justify-center">
                    <Link
                      href="/crear-reporte"
                      className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/25"
                      aria-label="Nuevo reporte"
                    >
                      <Plus className="h-6 w-6 stroke-[2.5]" />
                    </Link>
                  </div>

                  <Link
                    href="/claves"
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                      isPath("/claves") ? "text-[#FF0C60]" : "text-muted-foreground"
                    )}
                  >
                    <Key className="h-5 w-5" />
                    Claves
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                          isOperadores || isPath("/operadores/monitoreo") || isPath("/configuracion")
                            ? "text-[#FF0C60]"
                            : "text-muted-foreground"
                        )}
                      >
                        <Menu className="h-5 w-5" />
                        Más
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" side="top" className="mb-3 w-52">
                      <DropdownMenuLabel>Más opciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/operadores">
                        <DropdownMenuItem className="gap-2">
                          <Headset className="h-4 w-4" /> Operadores
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/operadores/monitoreo">
                        <DropdownMenuItem className="gap-2">
                          <MonitorPlay className="h-4 w-4" /> Monitoreo
                        </DropdownMenuItem>
                      </Link>
                      {user?.role !== "ENGINEER" && (
                        <Link href="/configuracion">
                          <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" /> Configuración
                          </DropdownMenuItem>
                        </Link>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </nav>
            )}
          </>,
          document.body
        )}
    </>
  );
}
