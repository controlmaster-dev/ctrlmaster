"use client";

import React from "react";

const SIGNAL_BARS = [4, 7, 5, 8, 3, 6];

type StreamGridTileProps = {
  title: string;
  isPreview: boolean;
  isOnAir: boolean;
  onSelect: () => void;
};

export const StreamGridTile = React.memo(function StreamGridTile({
  title,
  isPreview,
  isOnAir,
  onSelect,
}: StreamGridTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex aspect-video min-h-[120px] w-full cursor-pointer flex-col justify-end overflow-hidden rounded-lg bg-black text-left ring-2 ring-offset-2 ring-offset-background transition-[ring-color] sm:min-h-[140px] lg:min-h-[160px] ${
        isOnAir
          ? "ring-emerald-500/70"
          : isPreview
            ? "ring-primary/80"
            : "ring-transparent hover:ring-border"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-zinc-900/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[36%] flex -translate-x-1/2 -translate-y-1/2 items-end gap-1 opacity-[0.18]"
        aria-hidden
      >
        {SIGNAL_BARS.map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-sm bg-white"
            style={{ height: `${h * 5}px` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full px-2.5 pb-2.5 pt-8">
        {(isPreview || isOnAir) && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {isPreview && (
              <span className="rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                Vista previa
              </span>
            )}
            {isOnAir && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                Al aire
              </span>
            )}
          </div>
        )}
        <span className="block truncate text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-[10px] text-white/50">Clic para previsualizar</span>
      </div>
    </button>
  );
});
