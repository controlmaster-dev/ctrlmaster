"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function StreamList({ streams, selectedStream, onSelect }) {
  return (
    _jsx("div", { className: "grid grid-cols-1 gap-2 mt-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent", children:
      streams.map((stream) => {
        const isSelected = selectedStream.title === stream.title;

        return (
          _jsxs("button", {

            onClick: () => onSelect(stream),
            className: cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
              isSelected ?
              "bg-zinc-800 border-[#FF0C60] shadow-[0_0_15px_rgba(255,12,96,0.15)]" :
              "bg-zinc-900/50 border-white/5 hover:bg-zinc-800 hover:border-white/10"
            ), children: [


            _jsx("div", { className: cn(
                "w-1 h-8 rounded-full transition-colors",
                isSelected ? "bg-[#FF0C60]" : "bg-zinc-700 group-hover:bg-zinc-600"
              ) }),

            _jsxs("div", { className: "flex-1", children: [
              _jsx("span", { className: cn(
                  "block text-sm font-semibold transition-colors",
                  isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                ), children:
                stream.title }
              ),
              _jsx("span", { className: "text-[10px] text-zinc-500 tracking-tight font-medium", children:
                isSelected ? "Reproduciendo" : "En línea" }
              )] }
            ),

            isSelected &&
            _jsx("div", { className: "w-8 h-8 rounded-full bg-[#FF0C60]/10 flex items-center justify-center text-[#FF0C60] animate-pulse", children:
              _jsx(Play, { className: "w-3.5 h-3.5 fill-current" }) }
            )] }, stream.title

          ));

      }) }
    ));

}