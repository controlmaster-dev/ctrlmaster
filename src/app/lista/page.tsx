"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, Ban, Archive, Play, Sparkles,
  Copy, Database, X, Terminal, Activity, CheckCircle2, AlertOctagon,
  Cpu, Layers, Eraser } from
"lucide-react";
import { parseProgramList } from "@/lib/program-validator";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export default function ProgramValidatorPage() {
  const [input, setInput] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [showKb, setShowKb] = useState(false);
  const [processedDays, setProcessedDays] = useState([]);


  useEffect(() => {
    const fetchKb = async () => {
      try {
        const res = await fetch('/api/validator/kb');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setKnowledgeBase(data.join(', '));
        }
      } catch (error) {console.error("Failed to load KB", error);}
    };
    fetchKb();
  }, []);

  const handleProcess = () => {
    const results = parseProgramList(input, knowledgeBase);
    setProcessedDays(results);
  };

  const handleClear = () => {
    setInput("");
    setProcessedDays([]);
  };

  const saveKbToApi = async () => {
    try {
      const res = await fetch('/api/validator/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: knowledgeBase })
      });
      if (res.ok) setShowKb(false);
    } catch (error) {console.error("Error saving KB", error);}
  };


  const stats = useMemo(() => {
    let total = 0,valid = 0,errors = 0,warnings = 0,corrected = 0;
    processedDays.forEach((day) => {
      day.programs.forEach((p) => {
        total++;
        if (p.status === 'VALID') valid++;
        if (p.status === 'MISSING' || p.status === 'CORRECTED') corrected++;
        if (p.status === 'INVALID_FORMAT') errors++;
        if (p.status === 'REMOVED' || p.status === 'ARCHIVE' || p.status === 'RECORDING') warnings++;
      });
    });
    return { total, valid, errors, warnings, corrected };
  }, [processedDays]);

  const getCleanOutput = () => {
    return processedDays.map((day) => {
      const validPrograms = day.programs.
      filter((p) => !['REMOVED', 'RECORDING', 'INVALID_FORMAT'].includes(p.status)).
      map((p) => p.code);
      if (validPrograms.length === 0) return '';
      return `${day.dayHeader}\n${validPrograms.join('\n')}`;
    }).filter(Boolean).join('\n\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCleanOutput());
  };

  return (

    _jsxs("div", { className: "min-h-screen w-full bg-background text-foreground flex flex-col font-sans selection:bg-[#FF0C60] selection:text-white pt-20 md:pt-24 px-4 md:px-8 pb-6 max-w-[1800px] mx-auto gap-6", children: [


      _jsxs("header", { className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0", children: [
        _jsxs("div", { className: "flex items-center gap-4", children: [
          _jsx("div", { className: "w-10 h-10 bg-[#FF0C60] rounded-md shadow-lg shadow-[#FF0C60]/20 flex items-center justify-center text-white", children:
            _jsx(Activity, { className: "w-6 h-6" }) }
          ),
          _jsxs("div", { children: [
            _jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Validador de Parrilla" }),
            _jsxs("p", { className: "text-xs text-muted-foreground font-medium flex items-center gap-2", children: [
              _jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), "SISTEMA DE CONTROL DE CONTINUIDAD"] }

            )] }
          )] }
        ),


        stats.total > 0 &&
        _jsxs("div", { className: "flex items-center gap-1 bg-card border border-border px-4 py-2 rounded-full shadow-sm animate-in slide-in-from-right-4 fade-in", children: [
          _jsx(StatItem, { label: "TOTAL", value: stats.total }),
          _jsx("div", { className: "w-px h-8 bg-border mx-3" }),
          _jsx(StatItem, { label: "CORRECTOS", value: stats.valid, color: "text-emerald-500" }),
          _jsx(StatItem, { label: "ERRORES", value: stats.errors, color: "text-rose-500" }),
          _jsx(StatItem, { label: "AVISOS", value: stats.warnings, color: "text-amber-500" })] }
        ),


        _jsx("div", { className: "flex gap-2", children:
          _jsxs("button", { onClick: () => setShowKb(true), className: "flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-card hover:bg-muted border border-border rounded-md transition-all shadow-sm", children: [
            _jsx(Database, { className: "w-4 h-4 text-blue-500" }),
            _jsx("span", { children: "Base de Datos" })] }
          ) }
        )] }
      ),


      _jsxs("main", { className: "flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]", children: [


        _jsxs("section", { className: "col-span-1 lg:col-span-5 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm ring-1 ring-border relative group transition-all hover:shadow-md", children: [

          _jsxs("div", { className: "h-12 border-b border-border bg-muted/20 flex items-center justify-between px-4", children: [
            _jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider", children: [
              _jsx(Terminal, { className: "w-4 h-4" }), "Entrada de Datos"] }

            ),
            _jsxs("button", { onClick: handleClear, className: "text-[10px] text-muted-foreground hover:text-rose-500 transition-colors uppercase font-bold tracking-wider flex items-center gap-1.5 px-2 py-1 hover:bg-rose-500/10 rounded", children: [
              _jsx(Eraser, { className: "w-3.5 h-3.5" }), " Limpiar"] }
            )] }
          ),


          _jsxs("div", { className: "flex-1 relative", children: [
            _jsx("textarea", {
              value: input,
              onChange: (e) => setInput(e.target.value),
              placeholder: "Pegar lista de programas aqu\xED...",
              className: "absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/30 custom-scrollbar",
              spellCheck: false }
            ),

            _jsx("div", { className: "absolute bottom-6 right-6 z-10", children:
              _jsxs("button", {
                onClick: handleProcess,
                className: "bg-[#FF0C60] hover:bg-[#D40050] text-white pl-4 pr-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:shadow-[#FF0C60]/30 transition-all flex items-center gap-3 font-bold tracking-wide group active:scale-95", children: [

                _jsx("div", { className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500", children:
                  _jsx(Play, { className: "w-4 h-4 fill-current" }) }
                ), "PROCESAR"] }

              ) }
            )] }
          )] }
        ),


        _jsxs("section", { className: "col-span-1 lg:col-span-7 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm ring-1 ring-border h-full", children: [
          _jsxs("div", { className: "h-12 border-b border-border bg-muted/20 flex items-center justify-between px-4", children: [
            _jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider", children: [
              _jsx(Cpu, { className: "w-4 h-4" }), "Resultados Procesados"] }

            ),
            _jsxs("button", { onClick: copyToClipboard, className: "text-[10px] text-muted-foreground hover:text-blue-500 transition-colors uppercase font-bold tracking-wider flex items-center gap-1.5 px-2 py-1 hover:bg-blue-500/10 rounded", children: [
              _jsx(Copy, { className: "w-3.5 h-3.5" }), " Copiar Limpio"] }
            )] }
          ),

          _jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-6 bg-muted/5 relative", children:
            processedDays.length === 0 ?
            _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center opacity-30 select-none gap-4", children: [
              _jsx("div", { className: "w-20 h-20 bg-muted rounded-full flex items-center justify-center", children:
                _jsx(Layers, { className: "w-10 h-10 text-muted-foreground" }) }
              ),
              _jsx("p", { className: "text-sm font-medium tracking-wide", children: "ESPERANDO AN\xC1LISIS..." })] }
            ) :

            _jsx("div", { className: "space-y-8 pb-10", children:
              processedDays.map((day, i) =>
              _jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-500", style: { animationDelay: `${i * 100}ms` }, children: [

                _jsxs("div", { className: "flex items-center gap-3 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-10 border-b border-border/50 shadow-sm -mx-2 px-2", children: [
                  _jsx("div", { className: "w-2 h-2 rounded-full bg-[#FF0C60]" }),
                  _jsx("h3", { className: "font-bold text-sm text-foreground uppercase tracking-tight", children: day.dayHeader })] }
                ),


                _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children:
                  day.programs.map((prog, j) =>
                  _jsx(LogItem, { program: prog }, j)
                  ) }
                )] }, i
              )
              ) }
            ) }

          )] }
        )] }
      ),


      _jsx(AnimatePresence, { children:
        showKb &&
        _jsx(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children:

          _jsxs(motion.div, {
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
            className: "bg-card w-full max-w-2xl border border-border shadow-2xl rounded-lg flex flex-col max-h-[85vh] overflow-hidden", children: [

            _jsxs("header", { className: "h-14 border-b border-border flex items-center justify-between px-6 bg-muted/20", children: [
              _jsxs("span", { className: "text-sm font-bold flex items-center gap-2", children: [
                _jsx(Database, { className: "w-4 h-4 text-blue-500" }), " Base de Conocimiento"] }
              ),
              _jsx("button", { onClick: () => setShowKb(false), className: "p-2 hover:bg-muted rounded-full transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] }
            ),

            _jsx("div", { className: "bg-blue-500/5 px-6 py-4 border-b border-blue-500/10", children:
              _jsxs("p", { className: "text-xs text-muted-foreground leading-relaxed", children: [
                _jsx("span", { className: "text-blue-500 font-bold", children: "IA DE CORRECCI\xD3N:" }), " El sistema usa esta lista para detectar errores tipogr\xE1ficos. Si escribes un c\xF3digo mal pero similar a uno de esta lista, se corregir\xE1 autom\xE1ticamente."] }
              ) }
            ),

            _jsx("textarea", {
              value: knowledgeBase,
              onChange: (e) => setKnowledgeBase(e.target.value),
              className: "flex-1 bg-background p-6 font-mono text-xs resize-none focus:outline-none",
              placeholder: "CARGANDO BASE DE DATOS...",
              spellCheck: false }
            ),
            _jsxs("footer", { className: "p-4 border-t border-border bg-muted/10 flex justify-end gap-3", children: [
              _jsx("button", { onClick: () => setShowKb(false), className: "px-5 py-2 text-xs font-semibold hover:bg-muted rounded-md transition-colors", children: "Cancelar" }),
              _jsx("button", { onClick: saveKbToApi, className: "bg-[#FF0C60] hover:bg-[#D40050] text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-md", children: "Guardar Cambios" }

              )] }
            )] }
          ) }
        ) }

      )] }
    ));

}
function StatItem({ label, value, color = "text-foreground" }) {
  return (
    _jsxs("div", { className: "px-3 flex flex-col items-center min-w-[70px]", children: [
      _jsx("span", { className: "text-[9px] font-bold text-muted-foreground tracking-widest", children: label }),
      _jsx("span", { className: cn("text-xl font-bold leading-none mt-1", color), children: value })] }
    ));

}

function LogItem({ program }) {
  const statusMap = {
    VALID: { color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircle2, label: "OK" },
    MISSING: { color: "text-indigo-500", bg: "bg-indigo-500/10", icon: Sparkles, label: "NUEVO" },
    CORRECTED: { color: "text-blue-500", bg: "bg-blue-500/10", icon: Sparkles, label: "CORREGIDO" },
    INVALID_FORMAT: { color: "text-rose-500", bg: "bg-rose-500/10", icon: Ban, label: "ERROR" },
    REMOVED: { color: "text-slate-500", bg: "bg-slate-500/10", icon: Ban, label: "OMITIR" },
    ARCHIVE: { color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle, label: "ARCHIVO" },
    RECORDING: { color: "text-purple-500", bg: "bg-purple-500/10", icon: Archive, label: "GRABAR" }
  };

  const config = statusMap[program.status] || { color: "text-slate-500", bg: "bg-slate-500/5", icon: AlertOctagon, label: "???" };
  const Icon = config.icon;



  return (
    _jsxs("div", { className: cn(
        "group flex items-start gap-3 p-3 rounded-md border transition-all relative overflow-hidden",
        "bg-card hover:bg-muted/40 hover:border-border hover:shadow-sm border-transparent"
      ), children: [

      _jsx("div", { className: cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", config.bg.replace('/10', '/50')) }),


      _jsx("div", { className: cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5", config.bg), children:
        _jsx(Icon, { className: cn("w-4 h-4", config.color) }) }
      ),

      _jsxs("div", { className: "flex-1 min-w-0", children: [

        _jsxs("div", { className: "flex justify-between items-center mb-0.5", children: [
          _jsx("span", { className: cn("font-mono text-sm font-bold tracking-tight", config.color), children:
            program.code }
          ),
          _jsx("span", { className: cn("text-[9px] font-bold uppercase tracking-wider opacity-60", config.color), children:
            config.label }
          )] }
        ),


        program.reason &&
        _jsx("div", { className: "text-[10px] text-muted-foreground font-medium leading-tight opacity-80 mt-1", children:
          program.reason }
        )] }

      )] }
    ));

}