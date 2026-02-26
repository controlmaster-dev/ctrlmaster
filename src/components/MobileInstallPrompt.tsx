"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X } from 'lucide-react';
import { Button } from './ui/button'; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function MobileInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;


    const isDismissed = localStorage.getItem('installPromptDismissed');

    if (isIosDevice && !isStandalone && !isDismissed) {

      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    _jsx(AnimatePresence, {
      children:
        showPrompt &&
        _jsx(motion.div, {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 },
          className: "fixed bottom-4 left-4 right-4 z-50 md:hidden", children:

            _jsxs("div", {
              className: "bg-[#1c1c1e] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden", children: [

                _jsx("div", { className: "absolute inset-0 bg-white/5 backdrop-blur-xl z-0" }),

                _jsxs("div", {
                  className: "relative z-10 flex flex-col gap-3", children: [
                    _jsxs("div", {
                      className: "flex justify-between items-start", children: [
                        _jsxs("div", {
                          children: [
                            _jsx("h3", { className: "font-bold text-white text-sm", children: "Instalar App" }),
                            _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Agrega a tu inicio para una mejor experiencia." }

                            )]
                        }
                        ),
                        _jsx(Button, {
                          variant: "ghost", size: "icon", className: "h-6 w-6 text-slate-400", onClick: dismiss, children:
                            _jsx(X, { className: "w-4 h-4" })
                        }
                        )]
                    }
                    ),

                    _jsxs("div", {
                      className: "flex items-center gap-3 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5", children: [
                        _jsxs("div", {
                          className: "flex items-center gap-2", children: [
                            _jsx("span", { children: "Toque" }),
                            _jsx(Share, { className: "w-4 h-4 text-blue-500" })]
                        }
                        ),
                        _jsx("span", { children: "y luego" }),
                        _jsxs("div", {
                          className: "flex items-center gap-2", children: [
                            _jsx("span", { children: "Agregar a Inicio" }),
                            _jsx(PlusSquare, { className: "w-4 h-4 text-white" })]
                        }
                        )]
                    }
                    )]
                }
                )]
            }
            )
        }
        )
    }

    ));

}