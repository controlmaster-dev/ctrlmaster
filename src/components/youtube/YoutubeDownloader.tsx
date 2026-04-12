'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Music, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Youtube, Clock, User } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoInfo {
  title: string;
  author: string;
  thumbnails: { url: string; width: number; height: number }[];
  duration: string;
  videoId: string;
}

export function YoutubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const fetchInfo = async () => {
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      toast.error('Por favor ingrese una URL válida de YouTube');
      return;
    }

    setLoading(true);
    setVideoInfo(null);
    try {
      const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setVideoInfo(data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo obtener la información del video. Es posible que YouTube esté bloqueando la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: 'audio' | 'video' = 'audio') => {
    if (!videoInfo) return;
    
    if (type === 'audio') setDownloadingAudio(true);
    else setDownloadingVideo(true);
    
    toast.info(`Iniciando descarga de ${type === 'audio' ? 'audio' : 'video'}...`);
    
    try {
      const downloadUrl = `/api/youtube/download?url=${encodeURIComponent(url)}&type=${type}`;
      
      // We fetch the header first to see if it's successful before triggering browser download
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al descargar el ${type}`);
      }

      // If it's OK, we can trigger the actual download
      // Since it's a stream, we can use the same URL for a real browser download
      // or we can use the blob approach, but blob might fail for large videos due to memory.
      // The best way for large files is a hidden link, but we already know it's OK now.
      const link = document.createElement('a');
      link.href = downloadUrl;
      const extension = type === 'audio' ? 'm4a' : 'mp4';
      // Sanitize title for filename
      const safeTitle = videoInfo.title.replace(/[^\w\s-]/gi, '').trim() || 'video';
      link.setAttribute('download', `${safeTitle}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`La descarga de ${type === 'audio' ? 'audio' : 'video'} debería comenzar en breve`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Error al intentar descargar el ${type}. Es posible que el video sea muy largo.`);
    } finally {
      setTimeout(() => {
        if (type === 'audio') setDownloadingAudio(false);
        else setDownloadingVideo(false);
      }, 3000);
    }
  };

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-sm">
            <Youtube className="w-6 h-6 text-[#FF0C60]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">YouTube <span className="text-[#FF0C60]">Downloader</span></h1>
            <p className="text-muted-foreground text-sm">Descarga audio y video de YouTube de forma rápida y sencilla.</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-border bg-card shadow-xl shadow-rose-500/5 overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={cn("w-5 h-5 transition-colors", url ? "text-[#FF0C60]" : "text-muted-foreground")} />
            </div>
            <Input
              type="text"
              placeholder="Pega aquí el link de YouTube (ej. https://youtube.com/watch?v=...)"
              className="pl-12 h-14 text-base bg-muted/30 border-border focus:border-[#FF0C60] focus:ring-[#FF0C60]/20 rounded-xl transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
            />
            <Button 
              onClick={fetchInfo}
              disabled={loading || !url}
              className="absolute right-2 top-2 bottom-2 bg-[#FF0C60] hover:bg-rose-600 text-white rounded-lg px-6 font-medium transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analizar"}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {videoInfo ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pt-6 border-t border-border/50"
              >
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-lg shrink-0 relative group">
                    {videoInfo.thumbnails && videoInfo.thumbnails.length > 0 ? (
                      <img 
                        src={videoInfo.thumbnails[videoInfo.thumbnails.length - 1].url} 
                        alt={videoInfo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Music className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDuration(videoInfo.duration)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4 py-1">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2">{videoInfo.title}</h2>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">{videoInfo.author}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button 
                        onClick={() => handleDownload('audio')}
                        disabled={downloadingAudio || downloadingVideo}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.05] active:scale-95"
                      >
                        {downloadingAudio ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Music className="w-4 h-4" />
                            Descargar Audio
                          </>
                        )}
                      </Button>

                      <Button 
                        onClick={() => handleDownload('video')}
                        disabled={downloadingAudio || downloadingVideo}
                        variant="secondary"
                        className="bg-sky-500 hover:bg-sky-600 text-white gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-sky-500/10 transition-all hover:scale-[1.05] active:scale-95 border-0"
                      >
                        {downloadingVideo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Descargar Video
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setUrl(''); setVideoInfo(null); }}
                        className="border-border bg-card text-muted-foreground hover:text-foreground h-12 rounded-xl px-6"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : loading ? (
              <div className="pt-6 border-t border-border/50 flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-[#FF0C60] animate-spin opacity-20" />
                  <Music className="w-6 h-6 text-[#FF0C60] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <p className="text-muted-foreground text-sm font-medium animate-pulse">Analizando video...</p>
              </div>
            ) : (
              <div className="pt-6 border-t border-border/50 flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
                <Music className="w-12 h-12 text-muted-foreground" />
                <div className="max-w-xs">
                  <p className="text-sm font-medium">Ingresa un link para comenzar</p>
                  <p className="text-[11px]">Soportamos formatos MP3/M4A de alta calidad</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Info Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Music, title: "Alta Calidad", desc: "Extraemos el audio en el mejor bitrate disponible automáticamente." },
          { icon: CheckCircle2, title: "Sin Registro", desc: "No necesitas cuenta ni suscripciones para usar esta herramienta." },
          { icon: AlertCircle, title: "Límites", desc: "Videos muy largos (>20min) pueden fallar en la infraestructura gratuita." }
        ].map((tip, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-card border border-border flex gap-4 items-start shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <tip.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">{tip.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
