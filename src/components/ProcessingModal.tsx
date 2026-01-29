"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

interface ProcessingModalProps {
    isOpen: boolean
    title?: string
    message?: string
}

export function ProcessingModal({ isOpen, title = "Procesando", message = "Espere un momento..." }: ProcessingModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
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
                        <div className="bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center gap-4">
                            <div className="bg-white/5 p-3 rounded-full">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-medium text-white">{title}</h3>
                                <p className="text-xs text-[#a1a1aa]">{message}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
