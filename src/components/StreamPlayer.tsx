"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ReactPlayerAny = ReactPlayer;

export function StreamPlayer({ url, title }) {
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);

  return (
    _jsxs("div", { className: "flex flex-col gap-2 p-4 bg-card rounded-lg border shadow-sm h-full", children: [
      _jsxs("div", { className: "flex items-center justify-between pb-2 border-b mb-2", children: [
        _jsx("h3", { className: "font-semibold text-lg", children: title }),
        _jsxs("div", { className: "flex items-center gap-2", children: [
          _jsxs("span", { className: "relative flex h-3 w-3", children: [
            _jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }),
            _jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-red-500" })] }
          ),
          _jsx("span", { className: "text-xs text-muted-foreground font-mono", children: "LIVE" })] }
        )] }
      ),

      _jsx("div", { className: "relative aspect-video bg-black rounded-md overflow-hidden bg-muted", children:
        hasWindow &&
        _jsx(ReactPlayerAny, {
          url: url,
          width: "100%",
          height: "100%",
          controls: true,
          playing: true,
          muted: true,
          config: {
            file: {
              forceHLS: true
            }
          } }
        ) }

      )] }
    ));

}