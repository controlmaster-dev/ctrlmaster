"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface Stream {
    title: string;
    url: string;
}

interface StreamListProps {
    streams: Stream[];
    selectedStream: Stream;
    onSelect: (stream: Stream) => void;
}

export function StreamList({ streams, selectedStream, onSelect }: StreamListProps) {
    return (
        <div className="grid grid-cols-1 gap-2 mt-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {streams.map((stream) => {
                const isSelected = selectedStream.title === stream.title;

                return (
                    <button
                        key={stream.title}
                        onClick={() => onSelect(stream)}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                            isSelected
                                ? "bg-zinc-800 border-[#FF0C60] shadow-[0_0_15px_rgba(255,12,96,0.15)]"
                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800 hover:border-white/10"
                        )}
                    >
                        {/* Status Indicator */}
                        <div className={cn(
                            "w-1 h-8 rounded-full transition-colors",
                            isSelected ? "bg-[#FF0C60]" : "bg-zinc-700 group-hover:bg-zinc-600"
                        )} />

                        <div className="flex-1">
                            <span className={cn(
                                "block text-sm font-semibold transition-colors",
                                isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                            )}>
                                {stream.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                {isSelected ? "Reproduciendo" : "En línea"}
                            </span>
                        </div>

                        {isSelected && (
                            <div className="w-8 h-8 rounded-full bg-[#FF0C60]/10 flex items-center justify-center text-[#FF0C60] animate-pulse">
                                <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
