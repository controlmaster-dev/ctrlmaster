"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, FileText, Ban, Archive, Play, Sparkles, Copy, Database, Settings, Check, X } from "lucide-react";
import { parseProgramList, DayData, ProgramStatus } from "@/lib/program-validator";

export default function ProgramValidatorPage() {
    const [input, setInput] = useState("");
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [showKb, setShowKb] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
    const [processedDays, setProcessedDays] = useState<DayData[]>([]);

    // Load KB from API on mount
    useEffect(() => {
        const fetchKb = async () => {
            try {
                const res = await fetch('/api/validator/kb');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const text = data.join(', ');
                        setKnowledgeBase(text);
                        // Knowledge base linked to state
                    }
                }
            } catch (error) {
                console.error("Failed to load knowledge base:", error);
            }
        };
        fetchKb();
    }, []);

    const handleSaveKb = (val: string) => {
        setKnowledgeBase(val);
        // We only save to DB when user clicks "Guardar"
    };

    const handleProcess = () => {
        const results = parseProgramList(input, knowledgeBase);
        setProcessedDays(results);
    };

    const handleClear = () => {
        setInput("");
        setProcessedDays([]);
    };

    const getCleanOutput = () => {
        return processedDays.map(day => {
            const validPrograms = day.programs
                .filter(p => p.status !== 'REMOVED' && p.status !== 'RECORDING' && p.status !== 'INVALID_FORMAT')
                .map(p => p.code);

            if (validPrograms.length === 0) return '';
            return `${day.dayHeader}\n${validPrograms.join('\n')}`;
        }).filter(Boolean).join('\n\n');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getCleanOutput());
    };



    const saveKbToApi = async () => {
        try {
            const res = await fetch('/api/validator/kb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: knowledgeBase })
            });

            if (res.ok) {
                setShowKb(false);
            } else {
                console.error("Failed to save KB");
                alert("Error guardando cambios");
            }
        } catch (error) {
            console.error("Error saving KB:", error);
            alert("Error de conexión");
        }
    };


    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff0048]/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#ff0048]/5 rounded-full blur-[180px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Knowledge Base Modal */}
            {showKb && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Glow effect in modal */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0048] to-purple-600" />

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                                    <Database className="w-5 h-5 text-[#ff0048]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">El conocimiento es poder.</h2>
                                    <p className="text-xs text-zinc-500 font-medium">IA de Gabo para poder tener información sobre los códigos.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowKb(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-[#ff0048]/5 border border-[#ff0048]/10 rounded-xl p-4 mb-5">
                            <h3 className="text-xs font-bold text-[#ff0048] uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                Inteligencia de Corrección
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                El sistema usa esta lista para aprender códigos validos (ej: <code>PENTH</code>, <code>CLAMO</code>).
                                Si encuentra un código mal escrito pero parecido, lo corregirá automáticamente basándose en esta base de datos.
                            </p>
                        </div>

                        <textarea
                            value={knowledgeBase}
                            onChange={(e) => handleSaveKb(e.target.value)}
                            placeholder="Ej: PENTH, CLAMO, VENTR, JWORS..."
                            className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-[#ff0048]/50 resize-none placeholder:text-zinc-700 leading-relaxed custom-scrollbar transition-colors"
                            spellCheck={false}
                        />

                        <div className="flex justify-end mt-6">
                            <button onClick={saveKbToApi} className="bg-[#ff0048] hover:bg-[#d4003c] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,0,72,0.3)] hover:shadow-[0_0_30px_rgba(255,0,72,0.5)]">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 flex flex-col h-screen overflow-hidden max-w-[1920px] mx-auto pt-36 pb-6 px-4 md:px-6 lg:px-8 gap-6">

                {/* Header - Compact */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-2 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            VALIDADOR
                            <span className="text-[#ff0048]">.</span>
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium">
                            Control Máster. Ni idea, trabajen señores.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowKb(true)}
                            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all flex items-center gap-2"
                        >
                            <Database className="w-4 h-4" />
                            Gestionar programas
                        </button>
                    </div>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto lg:overflow-visible">

                    {/* LEFT: Input */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 min-h-[400px] lg:min-h-0">
                        <div className="flex-1 bg-[#0f0f0f] border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                            <div className="px-5 py-4 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Entrada (Raw)
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={handleClear} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors" title="Limpiar">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleProcess}
                                        className="bg-[#ff0048] hover:bg-[#d4003c] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#ff0048]/20 hover:scale-105 active:scale-95"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        PROCESAR
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pegar lista de programas aquí..."
                                className="flex-1 bg-transparent p-5 text-sm font-mono text-zinc-300 focus:outline-none resize-none placeholder:text-zinc-800 leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* RIGHT: Results */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 min-h-[500px] lg:min-h-0">

                        {/* Tabs */}
                        <div className="flex items-center gap-2">
                            <div className="flex bg-[#0f0f0f] border border-white/5 rounded-xl p-1 shadow-lg">
                                <button
                                    onClick={() => setActiveTab('visual')}
                                    className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'visual' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    <Settings className="w-3.5 h-3.5" /> VISUAL
                                </button>
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'text' ? 'bg-[#ff0048] text-white shadow-lg shadow-[#ff0048]/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> TEXTO LIMPIO
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
                            {processedDays.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 gap-6">
                                    <div className="w-24 h-24 rounded-3xl bg-white/[0.02] flex items-center justify-center border border-white/5 rotate-3">
                                        <Play className="w-10 h-10 opacity-20 ml-1" />
                                    </div>
                                    <p className="text-sm font-bold tracking-widest uppercase opacity-50">Esperando Datos</p>
                                </div>
                            ) : (
                                <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-6 md:p-8">

                                    {/* VISUAL TAB */}
                                    {activeTab === 'visual' && processedDays.map((day, idx) => (
                                        <div key={idx} className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="flex items-center gap-4 mb-5">
                                                <h3 className="text-2xl font-black text-white leading-none tracking-tight">{day.dayHeader}</h3>
                                                <div className="h-[2px] w-24 bg-[#ff0048]" />
                                                <div className="h-[1px] flex-1 bg-white/5" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {day.programs.map((prog, pIdx) => (
                                                    <ProgramCard key={pIdx} program={prog} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* TEXT TAB */}
                                    {activeTab === 'text' && (
                                        <div className="h-full flex flex-col gap-4">
                                            <div className="flex justify-between items-center bg-[#ff0048]/10 p-5 rounded-2xl border border-[#ff0048]/20">
                                                <div>
                                                    <h4 className="text-base font-bold text-[#ff0048]">Lista Procesada & Limpia</h4>
                                                    <p className="text-xs text-[#ff0048]/70 mt-1 font-medium">Lista para copiar y pegar en Excel/Sheets.</p>
                                                </div>
                                                <button onClick={copyToClipboard} className="bg-[#ff0048] hover:bg-[#d4003c] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#ff0048]/20 hover:-translate-y-0.5">
                                                    <Copy className="w-4 h-4" /> COPIAR PORTAPAPELES
                                                </button>
                                            </div>
                                            <div className="relative flex-1 group">
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 pointer-events-none rounded-2xl" />
                                                <pre className="h-full bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-sm text-zinc-300 overflow-auto select-all shadow-inner">
                                                    {getCleanOutput()}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

}

function ProgramCard({ program }: { program: ProgramStatus }) {
    const config = {
        MISSING: {
            // "A LISTA" - Valid request that needs action (Segmentar)
            // User wanted Green for this.
            border: 'border-emerald-500/50', bg: 'bg-emerald-500/5', text: 'text-emerald-400',
            icon: Check, iconColor: 'text-emerald-500', label: 'A LISTA'
        },
        REMOVED: {
            border: 'border-zinc-800', bg: 'bg-zinc-900/50', text: 'text-zinc-600 line-through',
            icon: Ban, iconColor: 'text-zinc-600', label: 'OMITIDO'
        },
        RECORDING: {
            border: 'border-white/5', bg: 'bg-white/5', text: 'text-zinc-500',
            icon: Archive, iconColor: 'text-zinc-600', label: 'GRABACIÓN'
        },
        ARCHIVE: {
            // Warning state
            border: 'border-amber-500/50', bg: 'bg-amber-500/5', text: 'text-amber-400',
            icon: AlertTriangle, iconColor: 'text-amber-500', label: 'EN EL ARCHIVE'
        },
        INVALID_FORMAT: {
            border: 'border-red-900/50', bg: 'bg-red-900/10', text: 'text-red-500',
            icon: Ban, iconColor: 'text-red-600', label: 'ERROR FORMATO'
        },
        CORRECTED: {
            // Info state
            border: 'border-blue-500/50', bg: 'bg-blue-500/5', text: 'text-blue-400',
            icon: Sparkles, iconColor: 'text-blue-500', label: 'CORREGIDO'
        },
        VALID: {
            border: 'border-white/10', bg: 'bg-white/5', text: 'text-white',
            icon: FileText, iconColor: 'text-zinc-400', label: 'OK'
        }
    }[program.status] || { border: 'border-white/10', bg: 'bg-white/5', text: 'text-zinc-400', icon: FileText, iconColor: 'text-zinc-400', label: 'DESCONOCIDO' };

    const Icon = config.icon;

    return (
        <div className={`relative group p-4 rounded-xl border ${config.border} ${config.bg} transition-all hover:scale-[1.01] hover:shadow-2xl`}>
            {/* Status Label */}
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 border border-white/5 ${config.text}`}>
                    {config.label}
                </span>
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
            </div>

            {/* Code */}
            <div className="font-mono font-bold text-xl text-white mb-2 tracking-tight">
                {program.code}
            </div>

            {/* Metadata / Reason */}
            {program.reason && (
                <div className="text-[11px] text-zinc-500 font-medium border-t border-white/5 pt-3 mt-1 leading-relaxed">
                    {/* Highlight "Corregido" part if present */}
                    {program.reason.includes('Corregido') ? (
                        <span>
                            {program.reason.replace(/ \(Corregido.*\)/, '')}
                            <span className="text-blue-400 font-bold block mt-0.5">{program.reason.match(/Corregido.*/)?.[0]}</span>
                        </span>
                    ) : (
                        program.reason
                    )}
                </div>
            )}
        </div>
    );
}
