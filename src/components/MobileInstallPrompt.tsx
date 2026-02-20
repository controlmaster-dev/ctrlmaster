"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share, PlusSquare, X } from 'lucide-react'
import { Button } from './ui/button'

export function MobileInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)


    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)


        // Check if already standalone (installed)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true

        // Check if recently dismissed
        const isDismissed = localStorage.getItem('installPromptDismissed')

        if (isIosDevice && !isStandalone && !isDismissed) {
            // Wait a bit before showing
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    const dismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('installPromptDismissed', 'true')
    }

    if (!showPrompt) return null

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
                >
                    <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        {/* Glass effect */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl z-0" />

                        <div className="relative z-10 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white text-sm">Instalar App</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Agrega a tu inicio para una mejor experiencia.
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={dismiss}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <span>Toque</span>
                                    <Share className="w-4 h-4 text-blue-500" />
                                </div>
                                <span>y luego</span>
                                <div className="flex items-center gap-2">
                                    <span>Agregar a Inicio</span>
                                    <PlusSquare className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
