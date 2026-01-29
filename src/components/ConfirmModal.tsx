"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    type?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-sm"
                    >
                        <Card className="bg-white dark:bg-zinc-900 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl text-slate-900 dark:text-white w-full dark:shadow-black/50">
                            <CardContent className="pt-6 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-blue-500/10 dark:bg-blue-500/20'}`}
                                >
                                    {type === 'danger' ? (
                                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                                    ) : (
                                        <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                                    )}
                                </motion.div>
                                <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onCancel}
                                        className="flex-1 border-slate-200 dark:border-white/10 bg-transparent text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={onConfirm}
                                        className={`flex-1 text-white shadow-lg transition-all hover:scale-[1.02] ${type === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-500 dark:to-red-600/80 hover:from-red-700 hover:to-red-600 shadow-red-600/20' : 'bg-gradient-to-r from-blue-600 to-blue-500 dark:to-blue-600/80 hover:from-blue-700 hover:to-blue-600 shadow-blue-600/20'}`}
                                    >
                                        Confirmar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
