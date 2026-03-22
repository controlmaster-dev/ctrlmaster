"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoJSPlayer } from "@/components/VideoJSPlayer";
import { MonitoringStats } from "@/components/MonitoringStats";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function MonitoreoClient() {
  const streams = [
    { title: "Enlace TV", url: "https://livecdn.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8", label: "CAM 01" },
    { title: "Enlace Dallas", url: "https://livecdn-tx.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8", label: "CAM 02" },
    { title: "EJTV", url: "https://livecdn.enlace.plus/ejtv/smil:ejtv-hd.smil/playlist.m3u8", label: "CAM 03" },
    { title: "Planeta Creación", url: "https://livecdn.enlace.plus/planetacreacion/smil:planetacreacion-hd.smil/playlist.m3u8", label: "CAM 04" },
    { title: "En Concierto", url: "https://livecdn.enlace.plus/enconcierto/smil:enconcierto-hd.smil/playlist.m3u8", label: "CAM 05" },
    { title: "Los Evangelios", url: "https://livecdn.enlace.plus/evangelios/smil:evangelios-hd.smil/playlist.m3u8", label: "CAM 06" },
    { title: "Armando Alducin", url: "https://livecdn.enlace.plus/armandoalducin/smil:aatv-hd.smil/playlist.m3u8", label: "CAM 07" },
    { title: "Mujeres de Fe", url: "https://livecdn.enlace.plus/mujeresdefe/smil:mujeresdefe-hd.smil/playlist.m3u8", label: "CAM 08" }];


  const [currentTime, setCurrentTime] = useState("");
  const [pvwIndex, setPvwIndex] = useState(0);
  const [prgIndex, setPrgIndex] = useState(1);

  useEffect(() => {
    const savedPvw = localStorage.getItem('enlace_pvw_index');
    const savedPrg = localStorage.getItem('enlace_prg_index');
    if (savedPvw !== null) setPvwIndex(parseInt(savedPvw));
    if (savedPrg !== null) setPrgIndex(parseInt(savedPrg));
  }, []);

  useEffect(() => {
    localStorage.setItem('enlace_pvw_index', pvwIndex.toString());
    localStorage.setItem('enlace_prg_index', prgIndex.toString());
  }, [pvwIndex, prgIndex]);

  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-CR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const onVis = () => updateTime();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const handleCut = useCallback(() => {
    setPvwIndex(prgIndex);
    setPrgIndex(pvwIndex);
  }, [pvwIndex, prgIndex]);

  const handleSelectPreview = (idx: number) => {
    if (idx !== prgIndex) {
      setPvwIndex(idx);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleCut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCut]);

  return (
    _jsxs("div", {
      className: "flex flex-col min-h-screen bg-background text-foreground pt-14 md:pt-0 overflow-y-auto transition-colors duration-500 relative", children: [


        _jsxs("div", {
          className: "h-10 md:h-12 bg-card/95 border-b border-border flex items-center justify-between px-2 md:px-5 shrink-0 relative z-10", children: [
            _jsxs("div", {
              className: "flex items-center gap-2 md:gap-4", children: [
                _jsx(Link, {
                  href: "/", children:
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted", children:
                        _jsx(ArrowLeft, { className: "w-4 h-4" })
                    }
                    )
                }
                ),
                _jsx("div", { className: "h-4 w-[1px] bg-border mx-1 hidden md:block opacity-40" }),
                _jsx("span", { className: "text-[10px] font-medium text-foreground hidden md:block", children: "Multivista" }),
                _jsx("span", { className: "text-[10px] font-medium text-muted-foreground tracking-tight border-l border-border/50 pl-3 ml-1", children: currentTime }),
                _jsx("div", { className: "h-4 w-[1px] bg-border mx-2 hidden md:block opacity-40" }),
                _jsxs("span", {
                  className: "hidden md:inline-flex items-center gap-1.5 text-[9px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border font-medium tracking-wide", children: ["Pulsa ",
                    _jsx("kbd", { className: "text-primary font-semibold px-1.5 py-px rounded bg-background border border-border text-[8px] normal-case", children: "Espacio" }), " para cortar"]
                }
                )]
            }
            ),
            _jsxs("div", {
              className: "flex items-center gap-3", children: [
                _jsx(ThemeToggle, {}),
                _jsxs(Dialog, {
                  children: [
                    _jsx(DialogTrigger, {
                      asChild: true, children:
                        _jsxs(Button, {
                          variant: "ghost", size: "sm", className: "h-8 gap-2 text-[10px] font-medium tracking-wide hover:bg-muted text-muted-foreground hover:text-foreground transition-all bg-card border border-border rounded-lg", children: [
                            _jsx(Activity, { className: "w-3.5 h-3.5 text-primary/70" }),
                            _jsx("span", { className: "hidden md:inline normal-case", children: "Estado del sistema" })]
                        }
                        )
                    }
                    ),
                    _jsx(DialogContent, {
                      className: "max-w-6xl bg-card text-card-foreground border border-border backdrop-blur-xl p-0 overflow-hidden shadow-lg rounded-3xl", children:
                        _jsx(MonitoringStats, {})
                    }
                    )]
                }
                )]
            }
            )]
        }
        ),

        _jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 gap-2 p-2 shrink-0", children: [
            _jsxs("div", {
              className: "relative bg-black cursor-pointer group/master overflow-hidden aspect-video rounded-lg ring-1 ring-border",
              onClick: handleCut,
              title: "Clic o barra espaciadora para cortar", children: [

                _jsx(VideoJSPlayer, {
                  title: streams[pvwIndex]?.title || "SIN SEÑAL",
                  url: streams[pvwIndex]?.url || "",
                  variant: "preview"
                }
                ),
                _jsx("div", {
                  className: "absolute inset-0 bg-emerald-500/0 group-hover/master:bg-emerald-500/[0.07] dark:group-hover/master:bg-emerald-500/10 transition-colors z-50 flex items-center justify-center pointer-events-none", children:
                    _jsx("span", { className: "opacity-0 group-hover/master:opacity-100 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-background/95 dark:bg-popover/95 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-500/30 tracking-tight transition-all duration-300 transform translate-y-2 group-hover/master:translate-y-0 shadow-sm", children: "Clic para cortar" })
                }
                )]
            }
            ),

            _jsx("div", {
              className: "relative bg-black overflow-hidden aspect-video rounded-lg ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background", children:
                _jsx(VideoJSPlayer, {
                  title: streams[prgIndex]?.title || "SIN SEÑAL",
                  url: streams[prgIndex]?.url || "",
                  variant: "program"
                }
                )
            }
            )]
        }
        ),

        _jsx("div", {
          className: "flex-1 bg-background p-2 pt-0 grid grid-cols-2 md:grid-cols-4 gap-2", children:
            Array.from({ length: 8 }).map((_, i) => {
              const stream = streams[i];
              const isPVW = i === pvwIndex;
              const isPRG = i === prgIndex;

              return (
                _jsx("div", {

                  onClick: () => stream && handleSelectPreview(i),
                  className: `relative bg-black group transition-all duration-300 aspect-video cursor-pointer rounded-md overflow-hidden ring-2 ring-offset-2 ring-offset-background ${isPRG ? "ring-emerald-500/70" : isPVW ? "ring-primary/80" : "ring-transparent hover:ring-border"}`, children:

                    stream ?
                      _jsx(VideoJSPlayer, {
                        title: stream.title,
                        url: stream.url,
                        variant: isPRG ? 'program' : isPVW ? 'preview' : 'default'
                      }
                      ) :

                      _jsx("div", {
                        className: "w-full h-full flex items-center justify-center border-2 border-dashed border-border/20 bg-muted/10 rounded-sm", children:
                          _jsx("span", { className: "text-muted-foreground/30 font-light text-xl uppercase tracking-[0.3em]", children: "Sin se\xF1al" })
                      }
                      )
                }, `grid-${i}`

                ));

            })
        }
        )]
    }
    ));

}