"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MonitorX, VolumeX, Snowflake, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function MonitoringPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [creds, setCreds] = useState({ user: "", pass: "", iframeUrl: "" });

  useEffect(() => {
    const fetchCreds = async () => {
      try {
        const res = await fetch('/api/monitoring/creds');
        const data = await res.json();
        if (res.ok) {
          setCreds({
            user: data.user,
            pass: data.pass,
            iframeUrl: data.iframeUrl
          });
        }
      } catch (err) {
        toast.error("No se pudieron cargar las credenciales de seguridad");
      } finally {
        setLoadingCreds(false);
      }
    };

    if (user) {
      fetchCreds();
    }
  }, [user]);

  const handleQuickReport = async (type: string, description: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type,
          description: description + (customNote ? ` - Note: ${customNote}` : ''),
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Failed to log report");

      toast.success("Incidente registrado correctamente", {
        description: `${type} reportado a las ${new Date().toLocaleTimeString()}`
      });
      setCustomNote("");
    } catch (error) {
      toast.error("Error al registrar incidente");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCreds = () => {
    if (!creds.user || !creds.pass) return;
    navigator.clipboard.writeText(`User: ${creds.user} | Pass: ${creds.pass}`);
    toast.info("Credenciales copiadas al portapapeles");
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-white text-xl font-bold mb-4">Acceso Denegado</h1>
          <Button asChild>
            <Link href="/login">Inicia sesión para continuar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-80 bg-[#0A0A0B] border-r border-white/10 flex flex-col z-20">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-[#FF0C60]" />
            Centro de Monitoreo
          </h2>
          <p className="text-xs text-slate-400 mt-1">Reporte rápido de incidencias en vivo.</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-slate-400 font-medium tracking-tight">Acceso al multiview</p>
              {loadingCreds ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/5 font-mono text-slate-300">
                    <span className="truncate">u: {creds.user || "---"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/5 font-mono text-slate-300">
                    <span className="truncate">p: {creds.pass || "---"}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-7 gap-2 bg-transparent text-slate-400 hover:text-white" 
                    onClick={copyCreds}
                    disabled={!creds.user}
                  >
                    <Copy className="w-3 h-3" /> Copiar Ambas
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium tracking-tight">Reportar falla ahora</p>

            <Button
              variant="destructive"
              className="w-full justify-start h-12 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
              onClick={() => handleQuickReport("PANTALLA_NEGRA", "Pantalla Negra detectada en señal en vivo")}
              disabled={submitting}
            >
              <MonitorX className="mr-3 w-5 h-5" />
              Pantalla Negra
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start h-12 text-sm font-medium bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20 transition-all"
              onClick={() => handleQuickReport("SILENCIO", "Ausencia de audio detectada")}
              disabled={submitting}
            >
              <VolumeX className="mr-3 w-5 h-5" />
              Sin Audio / Silencio
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start h-12 text-sm font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all"
              onClick={() => handleQuickReport("CONGELADO", "Imagen congelada detectada")}
              disabled={submitting}
            >
              <Snowflake className="mr-3 w-5 h-5" />
              Imagen Congelada
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium tracking-tight">Nota adicional (opcional)</p>
            <Textarea
              placeholder="Detalles extra (ej: Canal 7, Intermitencia...)"
              className="bg-black/20 border-white/10 text-sm min-h-[80px]"
              value={customNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomNote(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <Button variant="ghost" className="w-full text-slate-400 hover:text-white" asChild>
            <Link href="/">Volver al Dashboard</Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 bg-black relative flex items-center justify-center">
        {loadingCreds ? (
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
        ) : (
          <iframe
            src={creds.iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            title="Control Master Multiview"
          />
        )}
      </main>
    </div>
  );
}