"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, HelpCircle, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "info" | "warning";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmModalProps) {
  const getColors = () => {
    switch (type) {
      case "danger":
        return "bg-red-500/10 text-red-500";
      case "warning":
        return "bg-amber-500/10 text-amber-500";
      case "info":
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="w-8 h-8" />;
      case "warning":
        return <AlertCircle className="w-8 h-8" />;
      case "info":
      default:
        return <HelpCircle className="w-8 h-8" />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "info":
      default:
        return "text-blue-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[400px] bg-background border-border text-foreground p-0 gap-0 overflow-hidden">
        <div className="p-6 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getColors()}`}
          >
            {getIcon()}
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex divide-x divide-border border-t border-border bg-muted/20">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-4 text-sm font-bold hover:bg-muted/50 transition-colors ${getConfirmButtonColor()}`}
          >
            Confirmar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}