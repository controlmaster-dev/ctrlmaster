"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface ThemeTransitionOverlayProps {
  isVisible: boolean;
  targetTheme: "dark" | "light";
}

export function ThemeTransitionOverlay({
  isVisible,
  targetTheme,
}: ThemeTransitionOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const isDark = targetTheme === "dark";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-8 max-w-md w-full px-6 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 ${
                  isDark
                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    : "bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                }`}
              >
                {isDark ? (
                  <Moon className="w-12 h-12" />
                ) : (
                  <Sun className="w-12 h-12" />
                )}
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`absolute inset-0 rounded-full border-2 ${
                  isDark ? "border-indigo-500/30" : "border-amber-500/30"
                }`}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {isDark ? "Preparando entorno oscuro" : "Volviendo a la luz"}
              </h2>
              <p className="text-muted-foreground font-medium">
                Ajustando contrastes y colores...
              </p>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                className={`h-full ${isDark ? "bg-indigo-500" : "bg-amber-500"}`}
              />
            </div>

            <span className="text-sm font-bold opacity-50 font-mono">
              {Math.round(progress)}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}