"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SuccessModal({ isOpen, onClose, title, message, type = 'success' }) {
  const isSuccess = type === 'success';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    _jsx(AnimatePresence, { children:
      isOpen &&
      _jsxs("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center", children: [

        _jsx(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
          onClick: onClose }
        ),


        _jsx(motion.div, {
          initial: { opacity: 0, scale: 0.98, y: 10 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.98, y: 10 },
          transition: { type: "spring", stiffness: 400, damping: 30 },
          className: "relative z-10 w-full max-w-sm px-4", children:

          _jsxs("div", { className: "bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4", children: [
            _jsxs("div", { className: "flex items-start gap-3", children: [
              _jsx("div", { className: `p-2 rounded-full mt-0.5 ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`, children:
                isSuccess ? _jsx(Check, { className: "w-4 h-4" }) : _jsx(X, { className: "w-4 h-4" }) }
              ),
              _jsxs("div", { className: "space-y-1 flex-1", children: [
                _jsx("h3", { className: "text-sm font-medium text-foreground", children: title || (isSuccess ? "Operación Exitosa" : "Error") }),
                _jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: message })] }
              )] }
            ),

            _jsx("div", { className: "flex justify-end", children:
              _jsx("button", {
                onClick: onClose,
                className: "px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity", children:
                "Entendido" }

              ) }
            )] }
          ) }
        )] }
      ) }

    ),
    document.body
  );
}