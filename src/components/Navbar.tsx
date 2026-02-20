"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, Home, Plus, Layout, Settings, LogOut, Command, Headset, MonitorPlay, Key, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import NextImage from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { CommandPalette } from "./CommandPalette"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [openPalette, setOpenPalette] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (!isMobile) {
          searchInputRef.current?.focus()
          setOpenPalette(true)
        } else {
          setOpenPalette(curr => !curr)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobile])

  const isActive = (path: string) => pathname === path ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"

  return (
    <>
      {/* Desktop & Mobile Search compatible triggers */}
      {mounted && isMobile && openPalette && (
        createPortal(<CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />, document.body)
      )}

      {/* --- DESKTOP NAVBAR (Hidden on mobile) --- */}
      <div className="hidden md:flex fixed top-6 left-0 right-0 z-40 justify-center items-center gap-4 pointer-events-none px-4">

        {/* Island 1: Navigation */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-background/80 backdrop-blur-2xl border border-border rounded-2xl p-2 flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-all duration-300 group hover:border-primary/30"
        >
          <div className="pl-2 pr-4 flex items-center gap-3 border-r border-border mr-1">
            <NextImage src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>

          <Link href="/">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/')}`} title="Inicio">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/crear-reporte">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/crear-reporte')}`} title="Nuevo Reporte">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/reportes">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/reportes')}`} title="Reportes">
              <Layout className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/claves">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/claves')}`} title="Bóveda de Claves">
              <Key className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Island 2: Search (Dynamic Island) */}
        <motion.div
          className="relative pointer-events-auto"
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            width: openPalette ? 580 : 420
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
        >
          <div
            className={`bg-background/80 backdrop-blur-2xl border rounded-2xl h-14 w-full flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 group overflow-hidden ${openPalette
              ? 'border-primary/40 bg-background shadow-[0_15px_40px_rgba(255,12,96,0.08)]'
              : 'border-border hover:border-primary/20 hover:scale-[1.005]'
              }`}
          >
            <div className="pl-6 flex items-center justify-center">
              <Search className={`w-5 h-5 transition-colors ${openPalette ? 'text-[#FF0C60]' : 'text-muted-foreground group-hover:text-[#FF0C60]'}`} />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setOpenPalette(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpenPalette(false)
                  searchInputRef.current?.blur()
                  setSearchQuery("")
                }
              }}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium text-foreground placeholder:text-muted-foreground/40 h-full"
            />

            <div className={`flex gap-1 pr-6 transition-opacity duration-300 ${openPalette ? 'opacity-0' : 'opacity-100'}`}>
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-lg bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground border border-border group-hover:border-primary/30">
                <Command className="w-3 h-3" /> K
              </kbd>
            </div>
          </div>

          {mounted && !isMobile && openPalette && (
            <CommandPalette
              isOpen={openPalette}
              onClose={() => {
                setOpenPalette(false)
                searchInputRef.current?.blur()
                setSearchQuery("")
              }}
              isIntegrated={true}
              externalQuery={searchQuery}
              onQueryChange={setSearchQuery}
            />
          )}
        </motion.div>

        {/* Island 3: Profile & Actions */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-background/80 backdrop-blur-2xl border border-border rounded-2xl p-2 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-all duration-300 hover:border-primary/30"
        >
          {user?.role !== 'ENGINEER' && (
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/configuracion')}`} title="Configuración">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link href="/operadores/monitoreo">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/operadores/monitoreo')}`} title="Monitoreo">
              <MonitorPlay className="w-5 h-5" />
            </Button>
          </Link>

          <Link href="/operadores">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/operadores')}`} title="Operadores">
              <Headset className="w-5 h-5" />
            </Button>
          </Link>

          <div className="w-px h-6 bg-border mx-1" />

          <ThemeToggle />

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

          <Button onClick={logout} variant="ghost" className="rounded-xl w-10 h-10 p-0 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:scale-110 transition-all duration-300" title="Cerrar Sesión">
            <LogOut className="w-5 h-5" />
          </Button>

          <div className="ml-1">
            <Avatar className="h-9 w-9 border border-border/50 ring-2 ring-transparent group-hover:ring-[#FF0C60]/20 transition-all duration-300 shadow-sm">
              <AvatarImage src={user?.avatar || ""} alt={user?.name || "User avatar"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CM'}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>
      </div>

      {/* --- MOBILE NAVBAR (Visible on mobile) --- */}
      {
        mounted && createPortal(
          <>
            {/* 1. Mobile Top Bar (Premium Glass) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                <NextImage src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" width={32} height={32} className="object-contain" />
                <span className="font-bold text-base text-foreground tracking-tight"></span>
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
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CM'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* 2. Mobile Clean Bottom Navigation */}
            {pathname !== '/crear-reporte' && (
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t border-border pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.1)]"
              >
                <div className="grid grid-cols-5 items-center h-[60px] relative">
                  <Link href="/" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`}>
                    <Home className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

                  <Link href="/reportes" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/reportes' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`}>
                    <Layout className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

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

                  <Link href="/claves" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/claves' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`}>
                    <Key className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                  </Link>

                  {/* 5th Button: Menu for Extra Items */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${['/operadores', '/operadores/monitoreo', '/configuracion'].includes(pathname) ? 'text-[#FF0C60]' : 'text-muted-foreground'}`}>
                        <Menu className="w-5 h-5 transition-transform duration-300 group-active:scale-110" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="mb-2 w-48 bg-background/95 backdrop-blur-xl border-border/50">
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
        )
      }
    </>
  )
}
