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
import { motion } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { CommandPalette } from "./CommandPalette";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openPalette, setOpenPalette] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mount detection + mobile check
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcut handler — useCallback is defined at component level, not inside useEffect
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

  const isActive = (path: string) =>
    pathname === path
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50";

  return (
    <>
      {/* Mobile command palette portal */}
      {mounted && isMobile && openPalette &&
        createPortal(
          <CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />,
          document.body
        )}

      {/* ── Desktop Navbar ─────────────────────────────────────────────────── */}
      <header className="pointer-events-auto sticky top-0 z-[100] hidden h-14 w-full items-center gap-2 border-b border-border bg-background/85 px-4 shadow-sm backdrop-blur-xl md:flex lg:px-6">

        {/* Izquierda: marca + navegación */}
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex shrink-0 items-center gap-3 lg:gap-4"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg pr-2 transition-opacity hover:opacity-90 lg:pr-3"
          >
            <NextImage
              src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
              alt="Control Master"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="hidden text-sm font-semibold tracking-tight text-foreground lg:inline">
              Control Master
            </span>
          </Link>

          <nav
            className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/25 p-0.5"
            aria-label="Navegación principal"
          >
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${isActive("/")}`}
                title="Inicio"
              >
                <Home className="h-[18px] w-[18px]" />
              </Button>
            </Link>

            <Link href="/crear-reporte">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${isActive("/crear-reporte")}`}
                title="Nuevo reporte"
              >
                <Plus className="h-[18px] w-[18px]" />
              </Button>
            </Link>

            <Link href="/reportes">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${isActive("/reportes")}`}
                title="Reportes"
              >
                <Layout className="h-[18px] w-[18px]" />
              </Button>
            </Link>

            <Link href="/claves">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${isActive("/claves")}`}
                title="Claves"
              >
                <Key className="h-[18px] w-[18px]" />
              </Button>
            </Link>
          </nav>
        </motion.div>

        {/* Centro: búsqueda */}
        <motion.div
          className={`relative mx-3 min-w-0 flex-1 pointer-events-auto lg:mx-8 xl:mx-12 ${
            openPalette ? "z-[100]" : ""
          }`}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.08 }}
        >
          <div
            className={`relative z-[101] mx-auto flex w-full max-w-md items-center gap-3 overflow-hidden border bg-muted/40 transition-all duration-300 group lg:max-w-lg xl:max-w-xl ${
              openPalette
                ? "h-11 rounded-t-2xl rounded-b-none border-b-transparent border-[#FF0C60]/35 bg-card shadow-md ring-1 ring-[#FF0C60]/15"
                : "h-10 rounded-xl border-border hover:border-[#FF0C60]/25"
            }`}
          >
            <div className="pl-4 w-10 flex items-center justify-center">
              <Search
                className={`w-4 h-4 transition-colors ${
                  openPalette ? "text-[#FF0C60]" : "text-muted-foreground group-hover:text-[#FF0C60]"
                }`}
              />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setOpenPalette(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpenPalette(false);
                  searchInputRef.current?.blur();
                  setSearchQuery("");
                }
              }}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium text-foreground placeholder:text-muted-foreground/40 h-full"
            />

            <div
              className={`flex gap-1 pr-4 w-16 justify-end transition-opacity duration-300 ${
                openPalette ? "opacity-0" : "opacity-100"
              }`}
            >
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border group-hover:border-primary/30">
                <Command className="w-3 h-3" /> K
              </kbd>
            </div>
          </div>

          {mounted && !isMobile && openPalette && (
            <div className="absolute top-full -mt-px left-0 right-0 z-50">
              <CommandPalette
                isOpen={openPalette}
                onClose={() => {
                  setOpenPalette(false);
                  searchInputRef.current?.blur();
                  setSearchQuery("");
                }}
                isIntegrated={true}
                externalQuery={searchQuery}
                onQueryChange={setSearchQuery}
              />
            </div>
          )}
        </motion.div>

        {/* Derecha: herramientas + cuenta */}
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.12 }}
          className="flex shrink-0 items-center gap-1.5 pointer-events-auto lg:gap-2"
        >
          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/25 p-0.5">
            {user?.role !== "ENGINEER" && (
              <Link href="/configuracion">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-lg ${isActive("/configuracion")}`}
                  title="Configuración"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </Button>
              </Link>
            )}

            <Link href="/operadores/monitoreo">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${isActive("/operadores/monitoreo")}`}
                title="Monitoreo de canales"
              >
                <MonitorPlay className="h-[18px] w-[18px]" />
              </Button>
            </Link>

            <Link href="/operadores">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg ${pathname.startsWith("/operadores") && pathname !== "/operadores/monitoreo" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
                title="Operadores"
              >
                <Headset className="h-[18px] w-[18px]" />
              </Button>
            </Link>
          </div>

          <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/25 p-0.5">
            <ThemeToggle />

            <Button
              onClick={logout}
              variant="ghost"
              className="h-9 w-9 rounded-lg p-0 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              title="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-0.5 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title={user?.name || "Mi cuenta"}
              >
                <Avatar className="h-9 w-9 border border-border/60 shadow-sm transition-shadow hover:ring-2 hover:ring-[#FF0C60]/25">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuario"} />
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
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
                <p className="text-sm font-medium text-foreground">{user?.name || "Usuario"}</p>
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
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </header>

      {/* ── Mobile Navbar (portal) ──────────────────────────────────────────── */}
      {mounted &&
        createPortal(
          <>
            {/* Top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                <NextImage
                  src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-bold text-base text-foreground tracking-tight" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpenPalette(true)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted/50 border border-border rounded-lg transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>

                <Link href="/configuracion">
                  <button className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted/50 border border-border rounded-lg transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                </Link>

                <ThemeToggle />

                <button
                  onClick={logout}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-rose-500 bg-muted/50 border border-border rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <Avatar className="h-9 w-9 border border-border/50 transition-colors duration-300">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "User avatar"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "CM"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Bottom tab bar */}
            {pathname !== "/crear-reporte" && (
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t border-border pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.1)]"
              >
                <div className="grid grid-cols-5 items-center h-[60px] relative">
                  <Link
                    href="/"
                    className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${
                      pathname === "/" ? "text-[#FF0C60]" : "text-muted-foreground"
                    }`}
                  >
                    <Home className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

                  <Link
                    href="/reportes"
                    className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${
                      pathname === "/reportes" ? "text-[#FF0C60]" : "text-muted-foreground"
                    }`}
                  >
                    <Layout className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

                  {/* Center FAB */}
                  <div className="relative h-full flex items-center justify-center -mt-8 pointer-events-none">
                    <Link href="/crear-reporte" className="pointer-events-auto">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 rounded-full bg-[#FF0C60] shadow-[0_4px_20px_rgba(255,12,96,0.4)] border-4 border-background flex items-center justify-center text-white transition-transform"
                      >
                        <Plus className="w-7 h-7 stroke-[3]" />
                      </motion.div>
                    </Link>
                  </div>

                  <Link
                    href="/claves"
                    className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${
                      pathname === "/claves" ? "text-[#FF0C60]" : "text-muted-foreground"
                    }`}
                  >
                    <Key className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

                  {/* More menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${
                          ["/operadores", "/operadores/monitoreo", "/configuracion"].includes(pathname)
                            ? "text-[#FF0C60]"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Menu className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="top"
                      className="mb-2 w-48 bg-background/95 backdrop-blur-xl border-border/50"
                    >
                      <DropdownMenuLabel>Menú Principal</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/operadores">
                        <DropdownMenuItem className="cursor-pointer gap-2 py-3">
                          <Headset className="w-4 h-4" />
                          <span>Operadores</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/operadores/monitoreo">
                        <DropdownMenuItem className="cursor-pointer gap-2 py-3">
                          <MonitorPlay className="w-4 h-4" />
                          <span>Monitoreo</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <Link href="/configuracion">
                        <DropdownMenuItem className="cursor-pointer gap-2 py-3">
                          <Settings className="w-4 h-4" />
                          <span>Configuración</span>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )}
          </>,
          document.body
        )}
    </>
  );
}