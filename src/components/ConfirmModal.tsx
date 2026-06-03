"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-[400px]">
        <div className="px-6 pb-2 pt-6 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
              getColors()
            )}
          >
            {getIcon()}
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex gap-2 border-t border-border/80 p-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={type === "danger" ? "destructive" : "default"}
            className={cn(
              "flex-1",
              type === "warning" && "bg-amber-600 text-white hover:bg-amber-600/90"
            )}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}