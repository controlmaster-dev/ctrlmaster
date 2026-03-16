"use client";

import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Signal, VolumeX, ShieldCheck, Zap } from "lucide-react"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const generateSparklineData = (count) => {
  return Array.from({ length: 15 }, (_, i) => ({
    name: i.toString(),
    value: i === 14 ? count / 2 : Math.floor(Math.random() * (count + 10)) + 5
  }));
};

const MetricModule = React.memo(({ title, value, subtext, icon: Icon, color, data, barColor }: { title: string; value: string | number; subtext: string; icon: React.ElementType; color: string; data: Array<{ name: string, value: number }>; barColor: string; }) =>
  _jsxs("div", {
    className: "relative group overflow-hidden bg-card/40 backdrop-blur-xl border border-border/40 rounded-sm p-5 transition-all duration-300 hover:bg-card/60 shadow-[0_4px_20px_rgba(0,0,0,0.1)]", children: [

      _jsx("div", { className: "absolute inset-0 opacity-[0.03] pointer-events-none bg-[size:20px_20px] bg-grid-white/[0.2] z-0" }),

      _jsxs("div", {
        className: "flex justify-between items-start relative z-10", children: [
          _jsxs("div", {
            className: "space-y-1", children: [
              _jsxs("div", {
                className: "flex items-center gap-2", children: [
                  _jsx("span", { className: `w-0.5 h-3 ${barColor || 'bg-primary'} opacity-80 rounded-full shadow-[0_0_8px_var(--primary)]` }),
                  _jsx("h4", { className: "text-[9px] font-bold tracking-[0.25em] text-muted-foreground/80 uppercase", children: title })]
              }
              ),
              _jsx("div", {
                className: "text-4xl font-light tracking-tighter text-foreground/90", children:
                  value
              }
              ),
              _jsxs("div", {
                className: "text-[10px] text-muted-foreground/60 font-medium tracking-tight flex items-center gap-2", children: [
                  _jsx("div", { className: `w-1 h-1 rounded-full ${barColor || 'bg-primary/40'} animate-pulse shadow-[0_0_5px_var(--primary)]` }),
                  subtext]
              }
              )]
          }
          ),
          _jsx("div", {
            className: "p-2.5 rounded-sm bg-foreground/[0.03] border border-border/20 shadow-inner transition-all group-hover:bg-primary/5 group-hover:border-primary/20", children:
              _jsx(Icon, { className: `w-4 h-4 ${color} opacity-80` })
          }
          )]
      }
      ),


      _jsx("div", {
        className: "h-10 mt-6 relative overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity", children:
          _jsx(ResponsiveContainer, {
            width: "100%", height: "100%", children:
              _jsx(BarChart, {
                data: data, children:
                  _jsx(Bar, {
                    dataKey: "value", radius: [1, 1, 0, 0], isAnimationActive: false, children:
                      data.map((_, index) =>
                        _jsx(Cell, {

                          fill: index === data.length - 1 ? barColor || "var(--primary)" : "currentColor",
                          className: "text-muted-foreground/20"
                        }, `cell-${index}`
                        )
                      )
                  }
                  )
              }
              )
          }
          )
      }
      )]
  }
  )
);

const ChannelModule = ({ channel }) => {
  const totalErrors = (channel.blackScreen || 0) + (channel.silence || 0);
  const isCritical = totalErrors > 50;
  const isWarning = totalErrors > 10;

  return (
    _jsxs("div", {
      className: "bg-card/30 backdrop-blur-md border border-border/40 p-4 flex flex-col justify-between transition-all hover:bg-card/50 relative overflow-hidden group", children: [

        _jsx("div", { className: `absolute top-0 right-0 w-12 h-12 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary'}`, style: { clipPath: 'polygon(100% 0, 0 0, 100% 100%)' } }),

        _jsxs("div", {
          className: "flex justify-between items-start mb-4 relative z-10", children: [
            _jsxs("div", {
              className: "space-y-0.5", children: [
                _jsx("span", { className: "text-[8px] font-bold text-primary/40 tracking-[0.3em] uppercase", children: "HLS // UDP" }),
                _jsx("span", { className: "text-sm font-semibold text-foreground/80 uppercase tracking-tight block", children: channel.name })]
            }
            ),
            _jsx("div", {
              className: "flex items-center gap-2", children:
                _jsx("div", {
                  className: `text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 border rounded-sm ${isCritical ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                    isWarning ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                      'border-primary/40 text-primary-foreground bg-primary/20'}`, children:

                    isCritical ? 'CRITICAL' : isWarning ? 'ALERTA' : 'ESTABLE'
                }
                )
            }
            )]
        }
        ),

        _jsxs("div", {
          className: "grid grid-cols-3 gap-1.5 relative z-10", children: [
            _jsxs("div", {
              className: "bg-foreground/[0.03] p-2 rounded-sm border border-border/20 group-hover:bg-foreground/[0.05] transition-colors", children: [
                _jsx("div", { className: "text-[14px] font-bold text-foreground/80", children: (channel.blackScreen || 0).toString() }),
                _jsx("div", { className: "text-[7px] text-muted-foreground/40 tracking-widest uppercase mt-0.5", children: "Video" })]
            }
            ),
            _jsxs("div", {
              className: "bg-foreground/[0.03] p-2 rounded-sm border border-border/20 group-hover:bg-foreground/[0.05] transition-colors", children: [
                _jsx("div", { className: "text-[14px] font-bold text-foreground/80", children: (channel.silence || 0).toString() }),
                _jsx("div", { className: "text-[7px] text-muted-foreground/40 tracking-widest uppercase mt-0.5", children: "Audio" })]
            }
            ),
            _jsxs("div", {
              className: "bg-foreground/[0.03] p-2 rounded-sm border border-border/10 group-hover:bg-foreground/[0.05] transition-colors", children: [
                _jsx("div", { className: "text-[14px] font-bold text-muted-foreground/40", children: totalErrors.toString() }),
                _jsx("div", { className: "text-[7px] text-muted-foreground/30 tracking-widest uppercase mt-0.5", children: "Errores" })]
            }
            )]
        }
        )]
    }
    ));

};

export function MonitoringStats() {
  const [stats, setStats] = useState({
    uptime: 99.8,
    blackScreens: 0,
    silenceEvents: 0,
    totalChannels: 7,
    activeChannels: 7
  });

  const [channelStats, setChannelStats] = useState([]);
  const [trendData] = useState(() => ({
    active: generateSparklineData(20),
    videoLoss: generateSparklineData(50),
    silence: generateSparklineData(30)
  }));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/streams/stats');
        if (res.ok) {
          const data = await res.json();
          let blackCtx = 0;
          let silenceCtx = 0;
          data.forEach((d) => {
            blackCtx += d.blackScreen || 0;
            silenceCtx += d.silence || 0;
          });
          setStats((prev) => ({
            ...prev,
            blackScreens: blackCtx,
            silenceEvents: silenceCtx
          }));
          setChannelStats(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    _jsxs("div", {
      className: "flex flex-col h-[85vh] bg-background text-foreground relative overflow-hidden font-['obviously-variable']", children: [

        _jsx("div", { className: "absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" }),
        _jsx("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" }),
        _jsx("div", { className: "absolute inset-0 bg-grid-white/[0.015] bg-[size:32px_32px] pointer-events-none" }),


        _jsxs("div", {
          className: "px-10 py-10 border-b border-border/40 flex justify-between items-center bg-card/20 backdrop-blur-xl relative z-10", children: [
            _jsx("div", {
              className: "flex items-center gap-8", children:
                _jsxs("div", {
                  className: "flex flex-col gap-2", children: [
                    _jsxs("div", {
                      className: "flex items-center gap-3", children: [
                        _jsxs("div", {
                          className: "flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-sm shadow-[0_0_15px_rgba(var(--primary),0.1)]", children: [
                            _jsx("div", { className: "w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" }),
                            _jsx("span", { className: "text-[10px] font-bold tracking-[0.25em] text-primary uppercase", children: "NOC ACTIVO" })]
                        }
                        ),
                        _jsx("span", { className: "text-[10px] font-semibold text-muted-foreground/40 tracking-[0.2em] uppercase", children: "Control Master // Divisi\xF3n LATAM" })]
                    }
                    ),
                    _jsxs("h1", {
                      className: "text-5xl font-extralight tracking-tighter text-foreground/90", children: ["sistema.",
                        _jsx("span", { className: "text-primary/60 font-medium", children: "estado_global" })]
                    }
                    )]
                }
                )
            }
            ),
            _jsxs("div", {
              className: "flex items-center gap-12", children: [
                _jsxs("div", {
                  className: "flex flex-col items-end gap-1.5", children: [
                    _jsx("span", { className: "text-[10px] text-muted-foreground/50 font-bold tracking-[0.3em] uppercase", children: "Integridad Global" }),
                    _jsx("div", {
                      className: "flex items-center gap-3", children:
                        _jsxs("span", { className: "text-4xl font-light text-foreground/95 tracking-tighter", children: ["99.998", _jsx("span", { className: "text-primary/40 text-2xl font-bold ml-1", children: "%" })] })
                    }
                    )]
                }
                ),
                _jsx("div", { className: "h-16 w-[1px] bg-border/40" }),
                _jsx("div", {
                  className: "p-4 bg-primary/10 rounded-sm border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]", children:
                    _jsx(ShieldCheck, { className: "w-8 h-8 text-primary opacity-80" })
                }
                )]
            }
            )]
        }
        ),

        _jsxs("div", {
          className: "flex-1 overflow-y-auto p-10 space-y-12 relative z-10", children: [

            _jsxs("div", {
              className: "grid grid-cols-4 gap-4", children: [
                _jsx(MetricModule, {
                  title: "ACTIVIDAD",
                  value: `${stats.uptime}%`,
                  subtext: "N\xFAcleo de Red Estable",
                  icon: Zap,
                  color: "text-primary",
                  data: trendData.active,
                  barColor: "var(--primary)"
                }
                ),
                _jsx(MetricModule, {
                  title: "SE\xD1ALES",
                  value: `${stats.activeChannels}/${stats.totalChannels}`,
                  subtext: "Sincronizaci\xF3n Activa",
                  icon: Signal,
                  color: "text-zinc-400",
                  data: trendData.active,
                  barColor: "rgba(var(--foreground),0.2)"
                }
                ),
                _jsx(MetricModule, {
                  title: "P\xC9RDIDA DE VIDEO",
                  value: stats.blackScreens,
                  subtext: "Pantalla a Negro (24h)",
                  icon: AlertTriangle,
                  color: "text-red-400",
                  data: trendData.videoLoss,
                  barColor: "#ef4444"
                }
                ),
                _jsx(MetricModule, {
                  title: "P\xC9RDIDA DE AUDIO",
                  value: stats.silenceEvents,
                  subtext: "Silencio Detectado",
                  icon: VolumeX,
                  color: "text-amber-400",
                  data: trendData.silence,
                  barColor: "#f59e0b"
                }
                )]
            }
            ),


            _jsxs("div", {
              className: "space-y-6", children: [
                _jsxs("div", {
                  className: "flex items-center justify-between border-b border-border/40 pb-4", children: [
                    _jsxs("div", {
                      className: "flex items-center gap-4", children: [
                        _jsx("div", { className: "w-2 h-2 bg-primary/50 shadow-[0_0_8px_var(--primary)] rounded-full animate-pulse" }),
                        _jsx("h2", { className: "text-[11px] font-black tracking-[0.4em] text-muted-foreground/60 uppercase", children: "Matriz de Telemetr\xEDa" })]
                    }
                    ),
                    _jsxs("div", {
                      className: "flex items-center gap-2 text-[9px] font-bold text-primary/40 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10", children: [
                        _jsx("div", { className: "w-1 h-3 bg-primary/40 animate-bounce" }), " Escaneando Transpondedores..."]
                    }
                    )]
                }
                ),

                _jsx("div", {
                  className: "grid grid-cols-4 gap-4", children:
                    channelStats.length === 0 ?
                      Array.from({ length: 8 }).map((_, i) =>
                        _jsx("div", { className: "bg-card/20 h-32 animate-pulse rounded-sm border border-border/20" }, i)
                      ) :

                      channelStats.map((channel) =>
                        _jsx(ChannelModule, { channel: channel }, channel.name)
                      )
                }

                )]
            }
            )]
        }
        ),


        _jsxs("div", {
          className: "px-10 py-5 bg-card/60 backdrop-blur-3xl border-t border-border/40 flex justify-between items-center text-[9px] font-bold text-muted-foreground/40 tracking-[0.2em] uppercase relative z-10", children: [
            _jsxs("div", {
              className: "flex items-center gap-10", children: [
                _jsxs("span", { className: "flex items-center gap-2 group cursor-help", children: [_jsx("div", { className: "w-1 h-1 bg-primary/50 rounded-full group-hover:scale-150 transition-transform" }), " HW: NOC-SVR-3000-ELITE"] }),
                _jsxs("span", { className: "flex items-center gap-2 group cursor-help", children: [_jsx("div", { className: "w-1 h-1 bg-border rounded-full group-hover:scale-150 transition-transform" }), " N\xDACLEO: v5.10.x // ESTABLE"] }),
                _jsx("span", { className: "text-primary/60 font-black tracking-widest", children: "SOCKET SEGURO ACTIVO // CRYPTO-PASS" })]
            }
            ),
            _jsxs("div", {
              className: "flex gap-10 items-center", children: [
                _jsxs("span", { className: "opacity-60 flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-green-500/30 rounded-full animate-ping" }), " SINC UDP: ACTIVA"] }),
                _jsx("span", { className: "font-mono tracking-tighter opacity-80 border-l border-border/40 pl-10 text-[10px]", children: new Date().toISOString() })]
            }
            )]
        }
        )]
    }
    ));

}