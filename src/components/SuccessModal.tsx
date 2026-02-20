"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

interface SuccessModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message: string
    type?: 'success' | 'error'
}

export function SuccessModal({ isOpen, onClose, title, message, type = 'success' }: SuccessModalProps) {
    const isSuccess = type === 'success'
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
                        onClick={onClose}
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative z-10 w-full max-w-sm px-4"
                    >
                        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full mt-0.5 ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                                    {isSuccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-sm font-medium text-foreground">{title || (isSuccess ? "Operación Exitosa" : "Error")}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
