"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay";import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState("light");

  useEffect(() => setMounted(true), []);

  if (!mounted) return _jsx("div", { className: "w-10 h-10" });

  const isDark = theme === "dark";

  const handleThemeChange = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTargetTheme(nextTheme);
    setIsTransitioning(true);


    setTimeout(() => {
      setTheme(nextTheme);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 1500);
  };

  return (
    _jsxs(_Fragment, { children: [
      mounted && createPortal(
        _jsx(ThemeTransitionOverlay, {
          isVisible: isTransitioning,
          targetTheme: targetTheme }
        ),
        document.body
      ),

      _jsxs(Button, {
        variant: "ghost",
        size: "icon",
        className: "w-10 h-10 rounded-md text-muted-foreground hover:text-foreground relative overflow-hidden group",
        onClick: handleThemeChange,
        disabled: isTransitioning,
        title: "Cambiar tema", children: [

        _jsx(AnimatePresence, { mode: "wait", initial: false, children:
          _jsx(motion.div, {

            initial: { y: 20, opacity: 0, rotate: -90 },
            animate: { y: 0, opacity: 1, rotate: 0 },
            exit: { y: -20, opacity: 0, rotate: 90 },
            transition: {
              type: "spring",
              stiffness: 500,
              damping: 30
            },
            className: "flex items-center justify-center", children:

            isDark ?
            _jsx(Moon, { className: "h-5 w-5 text-indigo-400 fill-indigo-400/20" }) :

            _jsx(Sun, { className: "h-5 w-5 text-amber-500 fill-amber-500/20" }) }, isDark ? "dark" : "light"

          ) }
        ),


        _jsx(motion.div, {
          className: `absolute inset-0 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`,
          initial: { scale: 0.8 },
          whileHover: { scale: 1 } }
        ),
        _jsx("span", { className: "sr-only", children: "Toggle theme" })] }
      )] }
    ));

}