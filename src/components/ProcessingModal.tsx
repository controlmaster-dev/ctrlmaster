"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

interface ProcessingModalProps {
    isOpen: boolean
    title?: string
    message?: string
}

export function ProcessingModal({ isOpen, title = "Procesando", message = "Espere un momento..." }: ProcessingModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative z-10 w-full max-w-sm px-4"
                    >
                        {/* Minimalist Card */}
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center gap-4 min-w-[280px]">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
