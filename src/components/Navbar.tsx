"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Home, Plus, Layout, Settings, LogOut, Command, Headset, MonitorPlay, Key, Menu } from "lucide-react";
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
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openPalette, setOpenPalette] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isMobile) {
          searchInputRef.current?.focus();
          setOpenPalette(true);
        } else {
          setOpenPalette((curr) => !curr);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  const isActive = (path) => pathname === path ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50";

  return (
    _jsxs(_Fragment, { children: [

      mounted && isMobile && openPalette && (
      createPortal(_jsx(CommandPalette, { isOpen: openPalette, onClose: () => setOpenPalette(false) }), document.body)),



      _jsxs("div", { className: "hidden md:flex fixed top-6 left-0 right-0 z-40 justify-center items-center gap-4 pointer-events-none px-4", children: [


        _jsxs(motion.div, {
          initial: { y: -20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { duration: 0.3, delay: 0.05, type: "spring", stiffness: 400, damping: 30 },
          className: "bg-background/80 backdrop-blur-2xl border border-border rounded-2xl p-2 flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-all duration-300 group hover:border-primary/30", children: [

          _jsx("div", { className: "pl-2 pr-4 flex items-center gap-3 border-r border-border mr-1", children:
            _jsx(NextImage, { src: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png", alt: "Logo", width: 24, height: 24, className: "object-contain" }) }
          ),

          _jsx(Link, { href: "/", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/')}`, title: "Inicio", children:
              _jsx(Home, { className: "w-5 h-5" }) }
            ) }
          ),
          _jsx(Link, { href: "/crear-reporte", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/crear-reporte')}`, title: "Nuevo Reporte", children:
              _jsx(Plus, { className: "w-5 h-5" }) }
            ) }
          ),
          _jsx(Link, { href: "/reportes", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/reportes')}`, title: "Reportes", children:
              _jsx(Layout, { className: "w-5 h-5" }) }
            ) }
          ),
          _jsx(Link, { href: "/claves", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/claves')}`, title: "B\xF3veda de Claves", children:
              _jsx(Key, { className: "w-5 h-5" }) }
            ) }
          )] }
        ),


        _jsxs(motion.div, {
          className: "relative pointer-events-auto",
          initial: { y: -20, opacity: 0 },
          animate: {
            y: 0,
            opacity: 1,
            width: openPalette ? 580 : 420
          },
          transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.1 }, children: [

          _jsxs("div", {
            className: `bg-background/80 backdrop-blur-2xl border rounded-2xl h-14 w-full flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 group overflow-hidden ${openPalette ?
            'border-primary/40 bg-background shadow-[0_15px_40px_rgba(255,12,96,0.08)]' :
            'border-border hover:border-primary/20 hover:scale-[1.005]'}`, children: [


            _jsx("div", { className: "pl-6 flex items-center justify-center", children:
              _jsx(Search, { className: `w-5 h-5 transition-colors ${openPalette ? 'text-[#FF0C60]' : 'text-muted-foreground group-hover:text-[#FF0C60]'}` }) }
            ),

            _jsx("input", {
              ref: searchInputRef,
              type: "text",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              onFocus: () => setOpenPalette(true),
              onKeyDown: (e) => {
                if (e.key === 'Escape') {
                  setOpenPalette(false);
                  searchInputRef.current?.blur();
                  setSearchQuery("");
                }
              },
              placeholder: "\xBFQu\xE9 est\xE1s buscando?",
              className: "flex-1 bg-transparent border-none outline-none text-[14px] font-medium text-foreground placeholder:text-muted-foreground/40 h-full" }
            ),

            _jsx("div", { className: `flex gap-1 pr-6 transition-opacity duration-300 ${openPalette ? 'opacity-0' : 'opacity-100'}`, children:
              _jsxs("kbd", { className: "hidden sm:inline-flex h-6 items-center gap-1 rounded-lg bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground border border-border group-hover:border-primary/30", children: [
                _jsx(Command, { className: "w-3 h-3" }), " K"] }
              ) }
            )] }
          ),

          mounted && !isMobile && openPalette &&
          _jsx(CommandPalette, {
            isOpen: openPalette,
            onClose: () => {
              setOpenPalette(false);
              searchInputRef.current?.blur();
              setSearchQuery("");
            },
            isIntegrated: true,
            externalQuery: searchQuery,
            onQueryChange: setSearchQuery }
          )] }

        ),


        _jsxs(motion.div, {
          initial: { y: -20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { duration: 0.3, delay: 0.15, type: "spring", stiffness: 400, damping: 30 },
          className: "bg-background/80 backdrop-blur-2xl border border-border rounded-2xl p-2 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-all duration-300 hover:border-primary/30", children: [

          user?.role !== 'ENGINEER' &&
          _jsx(Link, { href: "/configuracion", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/configuracion')}`, title: "Configuraci\xF3n", children:
              _jsx(Settings, { className: "w-5 h-5" }) }
            ) }
          ),


          _jsx(Link, { href: "/operadores/monitoreo", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/operadores/monitoreo')}`, title: "Monitoreo", children:
              _jsx(MonitorPlay, { className: "w-5 h-5" }) }
            ) }
          ),

          _jsx(Link, { href: "/operadores", children:
            _jsx(Button, { variant: "ghost", size: "icon", className: `w-10 h-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${isActive('/operadores')}`, title: "Operadores", children:
              _jsx(Headset, { className: "w-5 h-5" }) }
            ) }
          ),

          _jsx("div", { className: "w-px h-6 bg-border mx-1" }),

          _jsx(ThemeToggle, {}),

          _jsx("div", { className: "w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" }),

          _jsx(Button, { onClick: logout, variant: "ghost", className: "rounded-xl w-10 h-10 p-0 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:scale-110 transition-all duration-300", title: "Cerrar Sesi\xF3n", children:
            _jsx(LogOut, { className: "w-5 h-5" }) }
          ),

          _jsx("div", { className: "ml-1", children:
            _jsxs(Avatar, { className: "h-9 w-9 border border-border/50 ring-2 ring-transparent group-hover:ring-[#FF0C60]/20 transition-all duration-300 shadow-sm", children: [
              _jsx(AvatarImage, { src: user?.avatar || "", alt: user?.name || "User avatar" }),
              _jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xs font-bold", children:
                user?.name?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'CM' }
              )] }
            ) }
          )] }
        )] }
      ),



      mounted && createPortal(
        _jsxs(_Fragment, { children: [

          _jsxs("div", { className: "md:hidden fixed top-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between shadow-2xl shadow-black/20", children: [
            _jsxs("div", { className: "flex items-center gap-3", children: [
              _jsx(NextImage, { src: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png", alt: "Logo", width: 32, height: 32, className: "object-contain" }),
              _jsx("span", { className: "font-bold text-base text-foreground tracking-tight" })] }
            ),

            _jsxs("div", { className: "flex items-center gap-3", children: [
              _jsx("button", {
                onClick: () => setOpenPalette(true),
                className: "w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted/50 border border-border rounded-lg transition-all", children:

                _jsx(Search, { className: "w-4 h-4" }) }
              ),

              _jsx(Link, { href: "/configuracion", children:
                _jsx("button", { className: "w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted/50 border border-border rounded-lg transition-all", children:
                  _jsx(Settings, { className: "w-4 h-4" }) }
                ) }
              ),

              _jsx(ThemeToggle, {}),

              _jsx("button", {
                onClick: logout,
                className: "w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-rose-500 bg-muted/50 border border-border rounded-lg transition-all", children:

                _jsx(LogOut, { className: "w-4 h-4" }) }
              ),

              _jsxs(Avatar, { className: "h-9 w-9 border border-border/50 transition-colors duration-300", children: [
                _jsx(AvatarImage, { src: user?.avatar || "", alt: user?.name || "User avatar" }),
                _jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xs font-bold", children:
                  user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'CM' }
                )] }
              )] }
            )] }
          ),


          pathname !== '/crear-reporte' &&
          _jsx(motion.div, {
            initial: { y: 80 },
            animate: { y: 0 },
            transition: { type: "spring", stiffness: 500, damping: 35 },
            className: "md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t border-border pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.1)]", children:

            _jsxs("div", { className: "grid grid-cols-5 items-center h-[60px] relative", children: [
              _jsx(Link, { href: "/", className: `flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`, children:
                _jsx(Home, { className: "w-5 h-5 transition-transform duration-300 group-active:scale-110" }) }
              ),

              _jsx(Link, { href: "/reportes", className: `flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/reportes' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`, children:
                _jsx(Layout, { className: "w-5 h-5 transition-transform duration-300 group-active:scale-110" }) }
              ),

              _jsx("div", { className: "relative h-full flex items-center justify-center -mt-8 pointer-events-none", children:
                _jsx(Link, { href: "/crear-reporte", className: "pointer-events-auto", children:
                  _jsx(motion.div, {
                    whileHover: { scale: 1.1 },
                    whileTap: { scale: 0.9 },
                    className: "w-14 h-14 rounded-full bg-[#FF0C60] shadow-[0_4px_20px_rgba(255,12,96,0.4)] border-4 border-background flex items-center justify-center text-white transition-transform", children:

                    _jsx(Plus, { className: "w-7 h-7 stroke-[3]" }) }
                  ) }
                ) }
              ),

              _jsx(Link, { href: "/claves", className: `flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${pathname === '/claves' ? 'text-[#FF0C60]' : 'text-muted-foreground'}`, children:
                _jsx(Key, { className: "w-5 h-5 transition-transform duration-300 group-active:scale-110" }) }
              ),


              _jsxs(DropdownMenu, { children: [
                _jsx(DropdownMenuTrigger, { asChild: true, children:
                  _jsx("button", { className: `flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition-all ${['/operadores', '/operadores/monitoreo', '/configuracion'].includes(pathname) ? 'text-[#FF0C60]' : 'text-muted-foreground'}`, children:
                    _jsx(Menu, { className: "w-5 h-5 transition-transform duration-300 group-active:scale-110" }) }
                  ) }
                ),
                _jsxs(DropdownMenuContent, { align: "end", side: "top", className: "mb-2 w-48 bg-background/95 backdrop-blur-xl border-border/50", children: [
                  _jsx(DropdownMenuLabel, { children: "Men\xFA Principal" }),
                  _jsx(DropdownMenuSeparator, {}),

                  _jsx(Link, { href: "/operadores", children:
                    _jsxs(DropdownMenuItem, { className: "cursor-pointer gap-2 py-3", children: [
                      _jsx(Headset, { className: "w-4 h-4" }),
                      _jsx("span", { children: "Operadores" })] }
                    ) }
                  ),

                  _jsx(Link, { href: "/operadores/monitoreo", children:
                    _jsxs(DropdownMenuItem, { className: "cursor-pointer gap-2 py-3", children: [
                      _jsx(MonitorPlay, { className: "w-4 h-4" }),
                      _jsx("span", { children: "Monitoreo" })] }
                    ) }
                  ),

                  _jsx(DropdownMenuSeparator, {}),

                  _jsx(Link, { href: "/configuracion", children:
                    _jsxs(DropdownMenuItem, { className: "cursor-pointer gap-2 py-3", children: [
                      _jsx(Settings, { className: "w-4 h-4" }),
                      _jsx("span", { children: "Configuraci\xF3n" })] }
                    ) }
                  )] }
                )] }
              )] }
            ) }
          )] }

        ),
        document.body
      )] }

    ));

}