"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, HelpCircle } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) {
  return (
    _jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onCancel(), children:
      _jsxs(DialogContent, { className: "sm:max-w-[400px] bg-background border-border text-foreground p-0 gap-0 overflow-hidden", children: [
        _jsxs("div", { className: "p-6 text-center", children: [
          _jsx("div", {
            className: `w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`, children:

            type === 'danger' ?
            _jsx(AlertTriangle, { className: "w-8 h-8" }) :

            _jsx(HelpCircle, { className: "w-8 h-8" }) }

          ),
          _jsxs(DialogHeader, { children: [
            _jsx(DialogTitle, { className: "text-xl font-bold text-center text-foreground", children: title }),
            _jsx(DialogDescription, { className: "text-center text-muted-foreground mt-2", children:
              message }
            )] }
          )] }
        ),
        _jsxs("div", { className: "flex divide-x divide-border border-t border-border bg-muted/20", children: [
          _jsx("button", {
            onClick: onCancel,
            className: "flex-1 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors", children:
            "Cancelar" }

          ),
          _jsx("button", {
            onClick: onConfirm,
            className: `flex-1 py-4 text-sm font-bold hover:bg-muted/50 transition-colors ${type === 'danger' ? 'text-red-500' : 'text-blue-500'}`, children:
            "Confirmar" }

          )] }
        )] }
      ) }
    ));

}