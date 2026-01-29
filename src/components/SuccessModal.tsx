"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"

interface SuccessModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message: string
    type?: 'success' | 'error'
}

export function SuccessModal({ isOpen, onClose, title, message, type = 'success' }: SuccessModalProps) {
    const isSuccess = type === 'success'

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
                        <div className="bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl p-6 flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full mt-0.5 ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {isSuccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-sm font-medium text-white">{title || (isSuccess ? "Operación Exitosa" : "Error")}</h3>
                                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{message}</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
