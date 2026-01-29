"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Search, Home, Plus, Layout, Settings, LogOut, Users, Command, CheckCircle, Headset, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { CommandPalette } from "./CommandPalette"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const [openPalette, setOpenPalette] = useState(false)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpenPalette(curr => !curr)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const isActive = (path: string) => pathname === path ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-white/5"

  const canAccessConfig = user?.email === 'knunez@enlace.org' || user?.role === 'COORDINATOR' || user?.role === 'ADMIN'

  return (
    <>
      <CommandPalette isOpen={openPalette} onClose={() => setOpenPalette(false)} />

      {/* --- DESKTOP NAVBAR (Hidden on mobile) --- */}
      <div className="hidden md:flex fixed top-6 left-0 right-0 z-40 justify-center items-center gap-4 pointer-events-none px-4">

        {/* Island 1: Navigation */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-full p-2 flex items-center gap-1 shadow-xl shadow-black/5 pointer-events-auto transition-all duration-300 ring-1 ring-white/5">
          <div className="pl-2 pr-4 flex items-center gap-3 border-r border-zinc-200 dark:border-white/10 mr-1">
            <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>

          <Link href="/">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/')}`} title="Inicio">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/operadores/monitoreo">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/operadores/monitoreo')}`} title="Monitoreo">
              <Activity className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/crear-reporte">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/crear-reporte')}`} title="Nuevo Reporte">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/reportes">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/reportes')}`} title="Reportes">
              <Layout className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/tareas">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/tareas')}`} title="Tareas">
              <CheckCircle className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Island 2: Search (Wide) */}
        <div
          onClick={() => setOpenPalette(true)}
          className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-full h-14 w-full max-w-lg px-6 flex items-center gap-4 shadow-xl shadow-black/5 cursor-pointer group hover:bg-white/10 transition-all pointer-events-auto ring-1 ring-white/5"
        >
          <Search className="w-5 h-5 text-zinc-500 dark:text-slate-500 group-hover:text-[#FF0C60] transition-colors" />
          <span className="flex-1 text-zinc-500 dark:text-slate-500 font-medium group-hover:text-zinc-800 dark:group-hover:text-slate-300 transition-colors truncate">
            Buscar o ejecutar comando...
          </span>
          <div className="flex gap-1">
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded bg-zinc-100 dark:bg-[#27272A] px-2 font-mono text-[10px] font-medium text-zinc-500 dark:text-slate-400 border border-zinc-200 dark:border-white/5">
              <Command className="w-3 h-3" /> K
            </kbd>
          </div>
        </div>

        {/* Island 3: Profile & Actions */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-full p-2 flex items-center gap-2 shadow-xl shadow-black/5 pointer-events-auto transition-all duration-300 ring-1 ring-white/5">
          {user?.role !== 'ENGINEER' && (
            <>
              <Link href="/usuarios">
                <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/usuarios')}`} title="Usuarios">
                  <Users className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/configuracion">
                <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/configuracion')}`} title="Configuración">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </>
          )}

          <Link href="/operadores">
            <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isActive('/operadores')}`} title="Operadores">
              <Headset className="w-5 h-5" />
            </Button>
          </Link>
          {/* DIVIDER */}



          <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 mx-1" />

          <Button onClick={logout} variant="ghost" className="rounded-full w-10 h-10 p-0 hover:bg-rose-500/10 text-zinc-500 dark:text-slate-400 hover:text-rose-500" title="Cerrar Sesión">
            <LogOut className="w-5 h-5" />
          </Button>

          <div className="ml-1">
            <Avatar className="w-9 h-9 border border-zinc-200 dark:border-white/10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium text-xs">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'OP'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* --- MOBILE NAVBAR (Visible on mobile) --- */}
      {mounted && createPortal(
        <>
          {/* 1. Mobile Top Bar (Premium Glass) */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-[9999] bg-black/20 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-black text-lg text-white tracking-tight">Control Master</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenPalette(true)}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 border border-white/5 rounded-full transition-all"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-rose-500 bg-white/5 border border-white/5 rounded-full transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <Avatar className="w-8 h-8 border border-white/10 ring-2 ring-black">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-zinc-800 text-white font-bold text-[10px]">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'OP'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* 2. Mobile Clean Bottom Navigation */}
          {pathname !== '/crear-reporte' && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-black/20 backdrop-blur-xl border-t border-white/5 pb-safe">
              <div className="grid grid-cols-6 items-center h-[60px] relative">

                <Link href="/" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                  <Home className="w-5 h-5" />
                </Link>

                <Link href="/operadores/monitoreo" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/operadores/monitoreo' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                  <Activity className="w-5 h-5" />
                </Link>

                <Link href="/tareas" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/tareas' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                  <CheckCircle className="w-5 h-5" />
                </Link>

                <div className="relative h-full flex items-center justify-center -mt-8 pointer-events-none">
                  <Link href="/crear-reporte" className="pointer-events-auto">
                    <div className="w-14 h-14 rounded-full bg-[#FF0C60] shadow-[0_4px_20px_rgba(255,12,96,0.4)] border-4 border-[#050505] flex items-center justify-center text-white active:scale-90 transition-transform">
                      <Plus className="w-7 h-7 stroke-[3]" />
                    </div>
                  </Link>
                </div>

                <Link href="/operadores" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/operadores' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                  <Users className="w-5 h-5" />
                </Link>

                {canAccessConfig ? (
                  <Link href="/configuracion" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/configuracion' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                    <Settings className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link href="/reportes" className={`flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/reportes' ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                    <Layout className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  )
}
