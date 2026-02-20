"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

interface StreamPlayerProps {
    url: string;
    title: string;
}

// Bypassing strict type check for ReactPlayer as types seem to be conflicting
const ReactPlayerAny = ReactPlayer as any;

export function StreamPlayer({ url, title }: StreamPlayerProps) {
    const [hasWindow, setHasWindow] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasWindow(true);
        }
    }, []);

    return (
        <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border shadow-sm h-full">
            <div className="flex items-center justify-between pb-2 border-b mb-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">LIVE</span>
                </div>
            </div>

            <div className="relative aspect-video bg-black rounded-md overflow-hidden bg-muted">
                {hasWindow && (
                    <ReactPlayerAny
                        url={url}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true}
                        muted={true} // Auto-play usually requires mute
                        config={{
                            file: {
                                forceHLS: true,
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
}
