"use client";

import { Youtube, Facebook } from "lucide-react";

interface SocialPlayerProps {
    platform: 'youtube' | 'facebook';
    url: string;
    title: string;
}

export function SocialPlayer({ platform, url, title }: SocialPlayerProps) {
    const isYoutube = platform === 'youtube';
    const accentColor = isYoutube ? 'text-red-500' : 'text-blue-500';
    const borderColor = isYoutube ? 'border-red-500/50' : 'border-blue-500/50';

    return (
        <div className={`relative w-full h-full group bg-black overflow-hidden border-2 transition-colors duration-500 ${borderColor}`}>

            {/* Reality Sync Label: Bottom Centered Pill */}
            <div className="absolute bottom-2 inset-x-0 z-40 flex justify-center pointer-events-none">
                <div className="bg-black/80 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl backdrop-blur-sm">
                    <span className={`text-[9px] font-bold tracking-tight ${accentColor} border-r border-white/20 pr-2 leading-none flex items-center gap-1`}>
                        {isYoutube ? <Youtube className="w-3 h-3" /> : <Facebook className="w-3 h-3" />}
                        {isYoutube ? 'Youtube live' : 'Facebook live'}
                    </span>
                    <span className="text-[9px] font-bold tracking-tight text-zinc-300 leading-none">
                        {title}
                    </span>
                </div>
            </div>

            {/* Embed Iframe */}
            <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe
                    src={url}
                    className="w-full h-full pointer-events-auto"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>

            {/* Glassy Overlay for pointer-events logic if needed */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent z-10" />
        </div>
    );
}
