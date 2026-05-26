"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";

export interface PautaReminderInfo {
  operatorName: string;
  dateLabel: string;
  dismissKey: string;
}

interface PautaReminderNoticeProps {
  data: PautaReminderInfo;
  onDismiss: () => void;
}

export function PautaReminderNotice({ data, onDismiss }: PautaReminderNoticeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur-md md:bottom-5 md:left-auto md:right-5 md:w-[17.5rem] md:rounded-lg md:border md:shadow-lg"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 md:max-w-none">
        <Bell className="h-4 w-4 shrink-0 text-[#FF0C60]" aria-hidden />

        <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
          <span className="text-muted-foreground">Pauta · </span>
          <span>{data.operatorName}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-[#FF0C60]">{data.dateLabel}</span>
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Cerrar recordatorio"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
