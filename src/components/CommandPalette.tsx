"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Users, Settings, FileText, ArrowRight, Layout, MonitorPlay, Headset, History, Sparkles, X } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function CommandPalette({ isOpen, onClose, isIntegrated = false, externalQuery, onQueryChange }) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState("");
  const query = isIntegrated ? externalQuery ?? "" : localQuery;
  const setQuery = isIntegrated ? onQueryChange ?? (() => {}) : setLocalQuery;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);


  const quickActions = [
  { label: 'Recientes', icon: History, path: '/reportes' },
  { label: 'Monitoreo', icon: MonitorPlay, path: '/operadores/monitoreo' },
  { label: 'Operadores', icon: Headset, path: '/operadores' },
  { label: 'Usuarios', icon: Users, path: '/usuarios' },
  { label: 'Ajustes', icon: Settings, path: '/configuracion' }];



  const displayItems = useMemo(() => {
    const sections = [
    {
      group: 'RECOMENDADOS',
      items: [
      { id: 'nav-home', label: 'Dashboard Principal', desc: 'Vista general del sistema y estadísticas técnicas.', icon: Layout, action: () => router.push('/') },
      { id: 'nav-new', label: 'Crear Nuevo Reporte', desc: 'Registrar un evento o incidencia en el sistema.', icon: Plus, action: () => router.push('/crear-reporte') }]

    },
    {
      group: 'APLICACIÓN',
      items: [
      { id: 'nav-reports', label: 'Historial de Reportes', desc: 'Explorar y filtrar todos los registros técnicos.', icon: FileText, action: () => router.push('/reportes') },
      { id: 'nav-monitor', label: 'Monitoreo Técnico', desc: 'Acceso a señales en vivo y métricas de red.', icon: MonitorPlay, action: () => router.push('/operadores/monitoreo') },
      { id: 'nav-users', label: 'Gestión de Operadores', desc: 'Panel de control de personal y turnos.', icon: Headset, action: () => router.push('/operadores') }]

    }];


    const allItems = sections.flatMap((s) => s.items);

    if (!query) return sections;

    const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
    );

    return [
    {
      group: 'RESULTADOS',
      items: filtered.length > 0 ? filtered : [
      {
        id: 'search-global',
        label: `Buscar "${query}" en reportes...`,
        desc: 'Búsqueda profunda en la base de datos de reportes históricos.',
        icon: Search,
        action: () => router.push(`/reportes?search=${query}`)
      }]

    }];

  }, [query, router]);

  const flatItems = useMemo(() => displayItems.flatMap((g) => g.items), [displayItems]);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) {
          item.action();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (!isIntegrated) setLocalQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen, isIntegrated]);

  return (
    _jsx(AnimatePresence, { children:
      isOpen &&
      _jsxs("div", { className: isIntegrated ?
        "absolute top-full left-0 right-0 z-[100] pt-2 pointer-events-none" :
        "fixed inset-0 z-[20000] flex items-start justify-center md:pt-[15vh] px-0 md:px-4", children: [

        !isIntegrated &&
        _jsx(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: onClose,
          className: "absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/60" }
        ),


        _jsxs(motion.div, {
          ref: containerRef,
          initial: isIntegrated ? { opacity: 0, y: -10 } : { opacity: 0, scale: 0.98, y: -20 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: isIntegrated ? { opacity: 0, y: -5 } : { opacity: 0, scale: 0.98, y: -20 },
          transition: { type: "spring", bounce: 0, duration: 0.3 },
          className: `relative w-full bg-popover/98 backdrop-blur-xl border-x md:border-t border-border overflow-hidden flex flex-col h-full md:h-auto md:max-h-[70vh] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] pointer-events-auto ${isIntegrated ?
          "rounded-b-[24px]" :
          "max-w-[720px] md:rounded-[32px] rounded-t-[24px] mt-[10vh] md:mt-0"}`, children: [



          !isIntegrated &&
          _jsx("div", { className: "p-4 pb-2", children:
            _jsxs("div", { className: "flex items-center px-4 h-12 md:h-14 bg-muted/30 border border-border focus-within:border-primary/40 focus-within:bg-popover transition-all duration-200 rounded-[16px] md:rounded-[18px]", children: [
              _jsx(Search, { className: "w-4 h-4 md:w-5 md:h-5 text-muted-foreground/50" }),
              _jsx("input", {
                autoFocus: true,
                value: query,
                onChange: (e) => setQuery(e.target.value),
                placeholder: "\xBFQu\xE9 necesitas buscar?",
                className: "flex-1 bg-transparent border-none outline-none px-3 text-sm md:text-base font-medium text-foreground placeholder:text-muted-foreground/40" }
              ),
              _jsx("button", { onClick: onClose, className: "p-2 hover:bg-muted rounded-full transition-colors", children:
                _jsx(X, { className: "w-5 h-5 text-muted-foreground/60" }) }
              )] }
            ) }
          ),



          _jsx("div", { className: "px-4 md:px-6 py-3 border-b border-border", children:
            _jsxs("div", { className: "flex items-center gap-2 overflow-x-auto no-scrollbar", children: [
              _jsx("span", { className: "text-[9px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mr-2", children: "Filtros" }),
              quickActions.map((action) =>
              _jsxs("button", {

                onClick: () => {router.push(action.path);onClose();},
                className: "h-8 md:h-9 flex items-center gap-2 px-4 md:px-5 rounded-full bg-muted border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-[10px] md:text-[11px] font-medium text-muted-foreground hover:text-primary whitespace-nowrap", children: [

                _jsx(action.icon, { className: "w-3.5 h-3.5 md:w-4 md:h-4" }),
                action.label] }, action.path
              )
              )] }
            ) }
          ),


          _jsx("div", { className: "flex-1 overflow-y-auto p-4 custom-scrollbar", children:
            displayItems.map((group, groupIndex) =>
            _jsxs("div", { className: "mb-8 last:mb-2", children: [
              _jsxs("div", { className: "px-4 md:px-5 mb-2 md:mb-3 flex items-center justify-between", children: [
                _jsx("span", { className: "text-[8px] md:text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]", children: group.group }),
                groupIndex === 0 && !query && _jsx(Sparkles, { className: "w-3 h-3 text-primary/60 animate-pulse" })] }
              ),
              _jsx("div", { className: "space-y-1.5", children:
                group.items.map((item) => {
                  const globalIndex = flatItems.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    _jsxs("button", {

                      onClick: () => {item.action();onClose();},
                      onMouseEnter: () => setSelectedIndex(globalIndex),
                      className: `w-full group/item flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-[16px] md:rounded-[20px] transition-all text-left relative overflow-hidden ${isSelected ?
                      'bg-muted/50' :
                      'hover:bg-muted/20'}`, children: [


                      isSelected &&
                      _jsx(motion.div, {
                        layoutId: "active-indicator",
                        className: "absolute left-0 top-4 bottom-4 w-1.5 bg-primary rounded-r-full",
                        transition: { type: "spring", stiffness: 400, damping: 30 } }
                      ),


                      _jsx("div", { className: `p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-200 ${isSelected ?
                        'bg-primary text-primary-foreground shadow-lg shadow-primary/20' :
                        'bg-muted/50 text-muted-foreground group-hover/item:text-foreground'}`, children:
                        _jsx(item.icon, { className: "w-4 h-4 md:w-5 md:h-5" }) }
                      ),

                      _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
                        _jsx("div", { className: "flex items-center gap-2", children:
                          _jsx("span", { className: `text-[13px] md:text-[14px] font-medium transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`, children:
                            item.label }
                          ) }
                        ),
                        _jsx("p", { className: `text-[11px] md:text-[12px] transition-colors mt-0.5 max-w-[480px] line-clamp-1 ${isSelected ? 'text-muted-foreground/80' : 'text-muted-foreground/40'}`, children:
                          item.desc }
                        )] }
                      )] }, item.id
                    ));

                }) }
              )] }, group.group
            )
            ) }
          ),


          _jsxs("div", { className: "px-6 md:px-8 py-4 md:py-5 bg-muted/30 border-t border-border flex justify-between items-center mt-auto", children: [
            _jsxs("div", { className: "flex items-center gap-3 md:gap-5 text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-widest", children: [
              _jsxs("div", { className: "flex items-center gap-1.5 md:gap-2", children: [
                _jsx("kbd", { className: "h-5 md:h-6 md:w-6 w-5 flex items-center justify-center rounded-md bg-popover border border-border shadow-sm text-[10px] text-foreground/70", children: "\u2191" }),
                _jsx("kbd", { className: "h-5 md:h-6 md:w-6 w-5 flex items-center justify-center rounded-md bg-popover border border-border shadow-sm text-[10px] text-foreground/70", children: "\u2193" }),
                _jsx("span", { className: "hidden xs:inline", children: "Navegar" })] }
              ),
              _jsxs("div", { className: "flex items-center gap-1.5 md:gap-2", children: [
                _jsx("kbd", { className: "h-5 md:h-6 px-1.5 md:px-2 flex items-center justify-center rounded-md bg-popover border border-border shadow-sm text-[10px] text-foreground/70", children: "ENTER" }),
                _jsx("span", { className: "hidden xs:inline", children: "Seleccionar" })] }
              )] }
            ),

            _jsxs("button", { className: "flex items-center gap-2 group/all text-primary", children: [
              _jsx("span", { className: "text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.12em]", children: "Todos" }),
              _jsx(ArrowRight, { className: "w-3.5 h-3.5 md:w-4 md:h-4 group-hover/all:translate-x-1 transition-transform" })] }
            )] }
          )] }
        )] }
      ) }

    ));

}