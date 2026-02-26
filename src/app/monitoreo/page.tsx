"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MonitorX, VolumeX, Snowflake, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export default function MonitoringPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customNote, setCustomNote] = useState("");


  const IFRAME_URL = "https://componentes.enlace.org/live/multiview/";
  const CREDENTIALS = { user: "controlmaster", pass: "Ae$QC9?3U" };

  const handleQuickReport = async (type, description) => {

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
    navigator.clipboard.writeText(`User: ${CREDENTIALS.user} | Pass: ${CREDENTIALS.pass}`);
    toast.info("Credenciales copiadas al portapapeles");
  };

  return (
    _jsxs("div", { className: "flex h-screen overflow-hidden", children: [

      _jsxs("aside", { className: "w-80 bg-[#0A0A0B] border-r border-white/10 flex flex-col z-20", children: [
        _jsxs("div", { className: "p-4 border-b border-white/10", children: [
          _jsxs("h2", { className: "font-bold text-white flex items-center gap-2", children: [
            _jsx(AlertTriangle, { className: "text-[#FF0C60]" }), "Centro de Monitoreo"] }

          ),
          _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Reporte r\xE1pido de incidencias en vivo." }

          )] }
        ),

        _jsxs("div", { className: "p-4 flex-1 overflow-y-auto space-y-6", children: [


          _jsx(Card, { className: "bg-white/5 border-white/10", children:
            _jsxs(CardContent, { className: "p-3 space-y-2", children: [
              _jsx("p", { className: "text-xs text-slate-400 font-medium tracking-tight", children: "Acceso al multiview" }),
              _jsx("div", { className: "flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/5 font-mono text-slate-300", children:
                _jsxs("span", { className: "truncate", children: ["u: ", CREDENTIALS.user] }) }
              ),
              _jsx("div", { className: "flex items-center gap-2 text-sm bg-black/40 p-2 rounded border border-white/5 font-mono text-slate-300", children:
                _jsxs("span", { className: "truncate", children: ["p: ", CREDENTIALS.pass] }) }
              ),
              _jsxs(Button, { variant: "outline", size: "sm", className: "w-full text-xs h-7 gap-2 bg-transparent text-slate-400 hover:text-white", onClick: copyCreds, children: [
                _jsx(Copy, { className: "w-3 h-3" }), " Copiar Ambas"] }
              )] }
            ) }
          ),


          _jsxs("div", { className: "space-y-3", children: [
            _jsx("p", { className: "text-xs text-slate-400 font-medium tracking-tight", children: "Reportar falla ahora" }),

            _jsxs(Button, {
              variant: "destructive",
              className: "w-full justify-start h-12 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all",
              onClick: () => handleQuickReport("PANTALLA_NEGRA", "Pantalla Negra detectada en señal en vivo"),
              disabled: submitting, children: [

              _jsx(MonitorX, { className: "mr-3 w-5 h-5" }), "Pantalla Negra"] }

            ),

            _jsxs(Button, {
              variant: "secondary",
              className: "w-full justify-start h-12 text-sm font-medium bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20 transition-all",
              onClick: () => handleQuickReport("SILENCIO", "Ausencia de audio detectada"),
              disabled: submitting, children: [

              _jsx(VolumeX, { className: "mr-3 w-5 h-5" }), "Sin Audio / Silencio"] }

            ),

            _jsxs(Button, {
              variant: "secondary",
              className: "w-full justify-start h-12 text-sm font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all",
              onClick: () => handleQuickReport("CONGELADO", "Imagen congelada detectada"),
              disabled: submitting, children: [

              _jsx(Snowflake, { className: "mr-3 w-5 h-5" }), "Imagen Congelada"] }

            )] }
          ),


          _jsxs("div", { className: "space-y-2", children: [
            _jsx("p", { className: "text-xs text-slate-400 font-medium tracking-tight", children: "Nota adicional (opcional)" }),
            _jsx(Textarea, {
              placeholder: "Detalles extra (ej: Canal 7, Intermitencia...)",
              className: "bg-black/20 border-white/10 text-sm min-h-[80px]",
              value: customNote,
              onChange: (e) => setCustomNote(e.target.value) }
            )] }
          )] }

        ),

        _jsx("div", { className: "p-4 border-t border-white/10 bg-black/20", children:
          _jsx(Button, { variant: "ghost", className: "w-full text-slate-400 hover:text-white", asChild: true, children:
            _jsx(Link, { href: "/", children: "Volver al Dashboard" }) }
          ) }
        )] }
      ),


      _jsx("main", { className: "flex-1 bg-black relative flex items-center justify-center", children:
        _jsx("iframe", {
          src: IFRAME_URL,
          className: "w-full h-full border-0",
          allowFullScreen: true,
          title: "Control Master Multiview" }
        ) }
      )] }
    ));

}