"use client";

import { useState, useEffect } from "react";
import { VideoJSPlayer } from "@/components/VideoJSPlayer";
import { MonitoringStats } from "@/components/MonitoringStats";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

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
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCut = () => {
    const temp = pvwIndex;
    setPvwIndex(prgIndex);
    setPrgIndex(temp);
  };

  const handleSelectPreview = (idx) => {
    if (idx !== prgIndex) {
      setPvwIndex(idx);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleCut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pvwIndex, prgIndex]);

  return (
    _jsxs("div", {
      className: "flex flex-col min-h-screen bg-background text-muted-foreground pt-14 md:pt-0 overflow-y-auto transition-colors duration-500 relative", children: [

        _jsx("div", { className: "absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay z-0" }),
        _jsx("div", { className: "absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-0" }),

        _jsxs("div", {
          className: "h-10 md:h-12 bg-card/40 backdrop-blur-xl border-b border-border/60 flex items-center justify-between px-2 md:px-5 shrink-0 relative z-10", children: [
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
                _jsx("span", { className: "text-[10px] font-medium text-foreground tracking-[0.2em] hidden md:block uppercase opacity-90", children: "Multiview 1.0" }),
                _jsx("span", { className: "text-[10px] font-medium text-muted-foreground tracking-tight border-l border-border/50 pl-3 ml-1", children: currentTime }),
                _jsx("div", { className: "h-4 w-[1px] bg-border mx-2 hidden md:block opacity-40" }),
                _jsxs("span", {
                  className: "hidden md:inline-block text-[9px] text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-sm border border-border/40 uppercase font-medium tracking-wide", children: ["PULSAR ",
                    _jsx("span", { className: "text-primary font-bold", children: "[ESPACIO]" }), " PARA CORTAR"]
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
                          variant: "ghost", size: "sm", className: "h-8 gap-2 text-[10px] font-medium tracking-widest hover:bg-muted text-muted-foreground hover:text-foreground transition-all bg-card/50 border border-border/50 rounded-md uppercase", children: [
                            _jsx(Activity, { className: "w-3.5 h-3.5 text-primary/70" }),
                            _jsx("span", { className: "hidden md:inline", children: "Estado del Sistema" })]
                        }
                        )
                    }
                    ),
                    _jsx(DialogContent, {
                      className: "max-w-6xl bg-black/40 backdrop-blur-3xl border-white/10 text-white p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-3xl", children:
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
              className: "relative bg-black cursor-pointer group/master overflow-hidden aspect-video ring-1 ring-border",
              onClick: handleCut,
              title: "Clic para CORTAR", children: [

                _jsx(VideoJSPlayer, {
                  title: streams[pvwIndex]?.title || "SIN SEÑAL",
                  url: streams[pvwIndex]?.url || "",
                  variant: "preview"
                }
                ),
                _jsx("div", {
                  className: "absolute inset-0 bg-green-500/0 group-hover/master:bg-green-500/5 transition-colors z-50 flex items-center justify-center pointer-events-none", children:
                    _jsx("span", { className: "opacity-0 group-hover/master:opacity-100 text-[10px] font-bold text-green-500 bg-black/80 px-4 py-1 rounded-full border border-green-500/20 tracking-tight transition-all duration-300 transform translate-y-2 group-hover/master:translate-y-0", children: "Clic para cortar" })
                }
                )]
            }
            ),

            _jsx("div", {
              className: "relative bg-black overflow-hidden aspect-video ring-1 ring-border", children:
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
                  className: "relative bg-black group transition-all duration-300 aspect-video cursor-pointer", children:

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