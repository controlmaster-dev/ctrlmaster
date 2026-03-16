"use client";

import { Youtube, Facebook } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SocialPlayer({ platform, url, title }) {
  const isYoutube = platform === 'youtube';
  const accentColor = isYoutube ? 'text-red-500' : 'text-blue-500';
  const borderColor = isYoutube ? 'border-red-500/50' : 'border-blue-500/50';
  return (
    _jsxs("div", { className: `relative w-full h-full group bg-black overflow-hidden border-2 transition-colors duration-500 ${borderColor}`, children: [


      _jsx("div", { className: "absolute bottom-2 inset-x-0 z-40 flex justify-center pointer-events-none", children:
        _jsxs("div", { className: "bg-black/80 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl backdrop-blur-sm", children: [
          _jsxs("span", { className: `text-[9px] font-bold tracking-tight ${accentColor} border-r border-white/20 pr-2 leading-none flex items-center gap-1`, children: [
            isYoutube ? _jsx(Youtube, { className: "w-3 h-3" }) : _jsx(Facebook, { className: "w-3 h-3" }),
            isYoutube ? 'Youtube live' : 'Facebook live'] }
          ),
          _jsx("span", { className: "text-[9px] font-bold tracking-tight text-zinc-300 leading-none", children:
            title }
          )] }
        ) }
      ),


      _jsx("div", { className: "w-full h-full bg-black flex items-center justify-center", children:
        _jsx("iframe", {
          src: url,
          className: "w-full h-full pointer-events-auto",
          frameBorder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowFullScreen: true }
        ) }
      ),


      _jsx("div", { className: "absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent z-10" })] }
    ));

}