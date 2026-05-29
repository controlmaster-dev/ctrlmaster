"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { NavRouteIndicator } from "@/components/NavRouteIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { DesktopMoreMenu } from "@/components/navbar/DesktopMoreMenu";
import { DesktopNavLinks } from "@/components/navbar/DesktopNavLinks";
import { MobileBottomNav } from "@/components/navbar/MobileBottomNav";
import { NavbarBrand } from "@/components/navbar/NavbarBrand";
import { UserAccountMenu } from "@/components/navbar/UserAccountMenu";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openPalette, setOpenPalette] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const focusSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        focusSearch();
      }
      if (event.key === "Escape") {
        closeSearch();
      }
    },
    [closeSearch, focusSearch]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {mounted && isMobile && openPalette &&
        createPortal(
          <CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />,
          document.body
        )}

      <header className="sticky top-0 z-[100] hidden border-b border-border bg-background/80 backdrop-blur-xl md:block">
        <NavRouteIndicator pathname={pathname} />
        <div className="mx-auto flex h-14 max-w-[2200px] items-center gap-2 px-6">
          <NavbarBrand />

          {user && <DesktopNavLinks pathname={pathname} />}

          <div className="flex-1" />

          {user && (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={focusSearch}
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
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onFocus={() => setOpenPalette(true)}
                      onBlur={(event) => {
                        if (!event.relatedTarget?.closest("[data-palette]")) {
                          setTimeout(() => {
                            if (!document.activeElement?.closest("[data-palette]")) closeSearch();
                          }, 150);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") closeSearch();
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

          {user && (
            <Link href="/crear-reporte" className="ml-1.5 hidden shrink-0 sm:block">
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-md bg-brand px-4 text-[13px] font-semibold text-white shadow-none hover:bg-brand-hover transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Nuevo reporte
              </Button>
            </Link>
          )}

          {user && <DesktopMoreMenu />}
          {user && <div className="mx-1.5 h-5 w-px bg-border" />}

          <ThemeToggle />
          {user ? (
            <UserAccountMenu user={user} logout={logout} />
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

      {mounted &&
        createPortal(
          <>
            <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-border bg-background/95 backdrop-blur-md md:hidden">
              <div className="flex h-14 items-center justify-between gap-3 px-4">
                <NavbarBrand compact />

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
                    <UserAccountMenu user={user} logout={logout} mobile />
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

            {user && <MobileBottomNav pathname={pathname} />}
          </>,
          document.body
        )}
    </>
  );
}
