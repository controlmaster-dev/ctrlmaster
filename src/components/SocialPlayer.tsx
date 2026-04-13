"use client";

import { Youtube, Facebook } from "lucide-react";

interface SocialPlayerProps {
  platform: "youtube" | "facebook";
  url: string;
  title: string;
}

export function SocialPlayer({ platform, url, title }: SocialPlayerProps) {
  const isYoutube = platform === "youtube";
  const accentColor = isYoutube ? "text-red-500" : "text-blue-500";
  const borderColor = isYoutube ? "border-red-500/50" : "border-blue-500/50";

  return (
    <div
      className={`relative w-full h-full group bg-black overflow-hidden border-2 transition-colors duration-500 ${borderColor}`}
    >
      <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-sm border border-white/10 group-hover:bg-black/80 transition-colors">
        <div
          className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest ${accentColor}`}
        >
          {isYoutube ? <Youtube className="w-3 h-3" /> : <Facebook className="w-3 h-3" />}
          {isYoutube ? "Youtube live" : "Facebook live"}
        </div>
        <span className="text-[9px] font-bold tracking-tight text-zinc-300 leading-none">
          {title}
        </span>
      </div>

      <div className="w-full h-full bg-black flex items-center justify-center">
        <iframe
          src={url}
          className="w-full h-full pointer-events-auto"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent z-10" />
    </div>
  );
}