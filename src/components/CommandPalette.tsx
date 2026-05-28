"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Users,
  Settings,
  FileText,
  ArrowRight,
  Layout,
  MonitorPlay,
  Headset,
  History,
  X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  action: () => void;
}

interface CommandSection {
  group: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isIntegrated?: boolean;
  externalQuery?: string;
  onQueryChange?: (query: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  isIntegrated = false,
  externalQuery,
  onQueryChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const query = isIntegrated ? externalQuery ?? "" : localQuery;
  const setQuery = isIntegrated ? onQueryChange ?? (() => {}) : setLocalQuery;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const quickActions = [
    { label: "Recientes", icon: History, path: "/reportes" },
    { label: "Monitoreo", icon: MonitorPlay, path: "/operadores/monitoreo" },
    { label: "Operadores", icon: Headset, path: "/operadores" },
    { label: "Usuarios", icon: Users, path: "/usuarios" },
    { label: "Ajustes", icon: Settings, path: "/configuracion" },
  ];

  const displayItems = useMemo<CommandSection[]>(() => {
    const sections: CommandSection[] = [
      {
        group: "Recomendados",
        items: [
          {
            id: "nav-home",
            label: "Inicio",
            desc: "Resumen del sistema y accesos rápidos.",
            icon: Layout,
            action: () => router.push("/"),
          },
          {
            id: "nav-new",
            label: "Nuevo reporte",
            desc: "Registrar una incidencia o evento.",
            icon: Plus,
            action: () => router.push("/crear-reporte"),
          },
        ],
      },
      {
        group: "Más opciones",
        items: [
          {
            id: "nav-reports",
            label: "Reportes",
            desc: "Ver y filtrar el historial.",
            icon: FileText,
            action: () => router.push("/reportes"),
          },
          {
            id: "nav-monitor",
            label: "Monitoreo de canales",
            desc: "Señales en vivo y estado técnico.",
            icon: MonitorPlay,
            action: () => router.push("/operadores/monitoreo"),
          },
          {
            id: "nav-users",
            label: "Operadores",
            desc: "Personal, turnos y disponibilidad.",
            icon: Headset,
            action: () => router.push("/operadores"),
          },
        ],
      },
    ];

    const allItems = sections.flatMap((s) => s.items);

    if (!query) return sections;

    const filtered = allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
    );

    return [
      {
        group: "Resultados",
        items:
          filtered.length > 0
            ? filtered
            : [
                {
                  id: "search-global",
                  label: `Buscar «${query}» en reportes`,
                  desc: "Abrir el historial con ese término.",
                  icon: Search,
                  action: () => router.push(`/reportes?search=${encodeURIComponent(query)}`),
                },
              ],
      },
    ];
  }, [query, router]);

  const flatItems = useMemo(() => displayItems.flatMap((g) => g.items), [displayItems]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [isOpen, selectedIndex, flatItems, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen && !isIntegrated) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isIntegrated, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (!isIntegrated) setLocalQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen, isIntegrated]);

  const backdrop = mounted
    ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.button
              type="button"
              aria-label="Cerrar búsqueda"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className={`fixed inset-0 border-0 bg-black/35 backdrop-blur-md dark:bg-black/50 ${
                isIntegrated ? "z-[95]" : "z-[19999]"
              }`}
            />
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  const panel = (
    <motion.div
      ref={containerRef}
      initial={isIntegrated ? { opacity: 0, y: -8 } : { opacity: 0, scale: 0.98, y: -16 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={isIntegrated ? { opacity: 0, y: -6 } : { opacity: 0, scale: 0.98, y: -16 }}
      transition={{ type: "spring", bounce: 0, duration: 0.28 }}
      className={`relative flex w-full flex-col overflow-hidden border border-border bg-card shadow-2xl pointer-events-auto ${
        isIntegrated
          ? "z-[100] max-h-[min(42vh,340px)] rounded-b-[2px] rounded-t-none border-t-0"
          : "z-[20001] mt-[10vh] max-h-[min(58vh,420px)] max-w-[480px] rounded-[2px] md:mt-[12vh]"
      }`}
    >
      <div className="h-0.5 shrink-0 bg-gradient-to-r from-[#FF0C60] via-[#FF0C60]/50 to-transparent" />

      {!isIntegrated && (
        <div className="shrink-0 border-b border-border/60 p-2.5">
          <div className="flex h-9 items-center gap-2 rounded-[2px] border border-border bg-muted/30 px-2.5 focus-within:border-[#FF0C60]/40 focus-within:ring-1 focus-within:ring-[#FF0C60]/15">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="h-full flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-b border-border/60 px-2.5 py-1.5">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {quickActions.map((action) => (
            <button
              key={action.path}
              type="button"
              onClick={() => {
                router.push(action.path);
                onClose();
              }}
              className="flex h-6 shrink-0 items-center gap-1 rounded-[2px] border border-border/80 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#FF0C60]/30 hover:bg-[#FF0C60]/5 hover:text-[#FF0C60]"
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-1.5 py-1">
        {displayItems.map((group) => (
          <div key={group.group} className="mb-2 last:mb-0">
            <p className="mb-0.5 px-1.5 text-[10px] font-medium text-muted-foreground">
              {group.group}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const globalIndex = flatItems.indexOf(item);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`flex w-full items-center gap-2 rounded-[2px] px-1.5 py-1.5 text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-[#FF0C60]/10 border-l-[3px] border-l-[#FF0C60] pl-[5px]"
                          : "border-l-[3px] border-l-transparent hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-colors ${
                          isSelected
                            ? "bg-[#FF0C60] text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[13px] font-medium leading-tight ${
                            isSelected ? "text-foreground" : "text-foreground/90"
                          }`}
                        >
                          {item.label}
                        </span>
                        {!isIntegrated && (
                          <span className="mt-px block truncate text-[11px] leading-tight text-muted-foreground">
                            {item.desc}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#FF0C60]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-2.5 py-1.5">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded-[2px] border border-border bg-background px-1 py-0.5 font-mono text-[9px]">
              ↑
            </kbd>
            <kbd className="rounded-[2px] border border-border bg-background px-1 py-0.5 font-mono text-[9px]">
              ↓
            </kbd>
            <span className="ml-0.5 hidden sm:inline">navegar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-[2px] border border-border bg-background px-1.5 py-0.5 font-mono text-[9px]">
              Enter
            </kbd>
            <span className="hidden sm:inline">abrir</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            router.push("/reportes");
            onClose();
          }}
          className="flex items-center gap-1 text-[10px] font-medium text-[#FF0C60] hover:underline"
        >
          {isIntegrated ? "Todos los reportes" : "Ver todos los reportes"}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {backdrop}
          {isIntegrated ? (
            <div className="absolute top-full left-0 right-0 z-[100] -mt-px flex justify-center pointer-events-none">
              <div className="w-full max-w-md pointer-events-none lg:max-w-lg xl:max-w-xl">
                {panel}
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 z-[20000] flex items-start justify-center px-4 pointer-events-none">
              {panel}
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
