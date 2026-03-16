"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ThemeTransitionOverlay({ isVisible, targetTheme }) {
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
    _jsx(AnimatePresence, { children:
      isVisible &&
      _jsx(motion.div, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md", children:

        _jsxs(motion.div, {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          className: "flex flex-col items-center gap-8 max-w-md w-full px-6 text-center", children: [


          _jsxs("div", { className: "relative", children: [
            _jsx(motion.div, {
              animate: {
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              },
              transition: { repeat: Infinity, duration: 2 },
              className: `p-6 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-500'}`, children:

              isDark ? _jsx(Moon, { className: "w-12 h-12" }) : _jsx(Sun, { className: "w-12 h-12" }) }
            ),


            _jsx(motion.div, {
              animate: { scale: [1, 1.5], opacity: [0.5, 0] },
              transition: { repeat: Infinity, duration: 1.5 },
              className: `absolute inset-0 rounded-full border-2 ${isDark ? 'border-indigo-500/30' : 'border-amber-500/30'}` }
            )] }
          ),


          _jsxs("div", { className: "space-y-2", children: [
            _jsx("h2", { className: "text-2xl font-bold tracking-tight", children:
              isDark ? "Preparando entorno oscuro" : "Volviendo a la luz" }
            ),
            _jsx("p", { className: "text-muted-foreground font-medium", children: "Ajustando contrastes y colores..." }

            )] }
          ),


          _jsx("div", { className: "w-full h-3 bg-muted rounded-full overflow-hidden border border-border", children:
            _jsx(motion.div, {
              initial: { width: "0%" },
              animate: { width: `${progress}%` },
              className: `h-full ${isDark ? 'bg-indigo-500' : 'bg-amber-500'}`,
              transition: { type: "spring", bounce: 0, duration: 0.1 } }
            ) }
          ),


          _jsxs("span", { className: "text-sm font-bold opacity-50 font-mono", children: [
            Math.round(progress), "%"] }
          )] }
        ) }
      ) }

    ));

}