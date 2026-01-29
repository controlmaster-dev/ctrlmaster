"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Home, Plus, Users, Settings, FileText, ArrowRight, Command } from "lucide-react"

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Actions & Search Logic
    const displayItems = useMemo(() => {
        const actions = [
            { id: 'nav-home', label: 'Ir al Inicio', icon: Home, action: () => router.push('/') },
            { id: 'nav-new', label: 'Crear Reporte', icon: Plus, action: () => router.push('/crear-reporte') },
            { id: 'nav-users', label: 'Gestionar Usuarios', icon: Users, action: () => router.push('/usuarios') },
            { id: 'nav-reports', label: 'Ver Historial de Reportes', icon: FileText, action: () => router.push('/reportes') },
            { id: 'nav-config', label: 'Configuración', icon: Settings, action: () => router.push('/configuracion') },
        ]

        const filteredActions = query
            ? actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
            : actions

        if (query.length > 0) {
            return [
                ...filteredActions,
                {
                    id: 'search-global',
                    label: `Buscar "${query}" en reportes...`,
                    icon: Search,
                    action: () => router.push(`/reportes?search=${query}`)
                }
            ]
        }
        return actions
    }, [query, router])

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % displayItems.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + displayItems.length) % displayItems.length)
            } else if (e.key === "Enter") {
                e.preventDefault()
                const item = displayItems[selectedIndex]
                if (item) {
                    item.action()
                    onClose()
                }
            } else if (e.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, selectedIndex, displayItems, onClose])

    // Reset index on query change
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-[#101012] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Input */}
                        <div className="flex items-center px-4 py-4 border-b border-slate-200 dark:border-white/5 gap-3">
                            <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Escribe un comando o busca algo..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                            />
                            <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500">ESC</div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {displayItems.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    No se encontraron resultados.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {displayItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { item.action(); onClose() }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${index === selectedIndex
                                                ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/20'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="flex-1 font-medium">{item.label}</span>
                                            {index === selectedIndex && (
                                                <ArrowRight className="w-4 h-4 opacity-50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs text-slate-500 font-medium">
                            <span>Control Máster v2.0</span>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1"><Command className="w-3 h-3" /> Navegar</span>
                                <span className="flex items-center gap-1">↵ Seleccionar</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
