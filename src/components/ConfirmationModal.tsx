
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false
}) {
  return (
    _jsx(Dialog, { open: isOpen, onOpenChange: onClose, children:
      _jsxs(DialogContent, { className: "sm:max-w-[425px] bg-[#18181B] border-white/10 text-slate-200", children: [
        _jsxs(DialogHeader, { children: [
          _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            _jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`, children:
              _jsx(AlertTriangle, { className: "w-5 h-5" }) }
            ),
            _jsx(DialogTitle, { className: "text-xl font-bold text-white", children: title })] }
          ),
          _jsx(DialogDescription, { className: "text-slate-400 text-base", children:
            message }
          )] }
        ),
        _jsxs(DialogFooter, { className: "mt-4 flex gap-2 sm:gap-0", children: [
          _jsx(Button, {
            variant: "ghost",
            onClick: onClose,
            className: "hover:bg-white/5 text-slate-400 hover:text-white", children:

            cancelText }
          ),
          _jsx(Button, {
            onClick: () => {onConfirm();onClose();},
            className: `${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FF0C60] hover:bg-[#D90A50]'} text-white font-bold`, children:

            confirmText }
          )] }
        )] }
      ) }
    ));

}