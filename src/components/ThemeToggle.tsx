"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [targetTheme, setTargetTheme] = useState<"light" | "dark">("light")

    useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="w-10 h-10" />

    const isDark = theme === "dark"

    const handleThemeChange = () => {
        const nextTheme = isDark ? "light" : "dark"
        setTargetTheme(nextTheme)
        setIsTransitioning(true)

        // Simulate a transition delay for the progress bar
        setTimeout(() => {
            setTheme(nextTheme)
            setTimeout(() => {
                setIsTransitioning(false)
            }, 500) // Small delay to show 100% and then fade out
        }, 1500)
    }

    return (
        <>
            {mounted && createPortal(
                <ThemeTransitionOverlay
                    isVisible={isTransitioning}
                    targetTheme={targetTheme}
                />,
                document.body
            )}

            <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-md text-muted-foreground hover:text-foreground relative overflow-hidden group"
                onClick={handleThemeChange}
                disabled={isTransitioning}
                title="Cambiar tema"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isDark ? "dark" : "light"}
                        initial={{ y: 20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 90 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                        }}
                        className="flex items-center justify-center"
                    >
                        {isDark ? (
                            <Moon className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
                        ) : (
                            <Sun className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Ambient Background Pulse */}
                <motion.div
                    className={`absolute inset-0 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </>
    )
}
