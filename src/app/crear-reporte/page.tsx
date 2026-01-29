"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Clock, ChevronRight, ChevronLeft, CheckCircle2, Upload, X, FileVideo, Info, Radio, Server, MonitorPlay, Zap, Activity, RefreshCw, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { SuccessModal } from "@/components/SuccessModal"
import { cn } from "@/lib/utils"

interface Attachment {
  url: string
  type: 'IMAGE' | 'VIDEO'
}

interface FormData {
  operatorId: string
  operatorName: string
  operatorEmail: string
  problemDescription: string
  dateStarted: string
  dateResolved: string
  isResolved: boolean
  priority: string
  categories: string[] // Changed to array for multi-select
  attachments: Attachment[]
  isManualDate: boolean
}

const CATEGORIES = [
  { id: "Transmisión", icon: <Radio className="w-4 h-4" />, desc: "Señal aire/satélite" },
  { id: "Audio", icon: <Activity className="w-4 h-4" />, desc: "Niveles, ruidos" },
  { id: "Video", icon: <MonitorPlay className="w-4 h-4" />, desc: "Calidad imagen" },
  { id: "Equipos", icon: <Server className="w-4 h-4" />, desc: "Hardware físico" },
  { id: "Software", icon: <Activity className="w-4 h-4" />, desc: "Apps, SO" },
  { id: "Falla Energética", icon: <Zap className="w-4 h-4" />, desc: "UPS, Planta" },
  { id: "Otros", icon: <Info className="w-4 h-4" />, desc: "General" }
]

const SYSTEMS = [
  { id: "Enlace", color: "bg-blue-500" },
  { id: "EJTV", color: "bg-orange-500" },
  { id: "Enlace USA", color: "bg-red-500" },
  { id: "Todos", color: "bg-purple-500" }
]

const STEPS = [
  { id: 0, title: "Contexto", desc: "Sistema y tpo de falla" },
  { id: 1, title: "Detalles", desc: "Qué, cuándo y dónde" },
  { id: 2, title: "Evidencia", desc: "Fotos y finalizar" }
]

export default function CreateReportSplit() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [fixingText, setFixingText] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    operatorId: "",
    operatorName: "",
    operatorEmail: "",
    problemDescription: "",
    dateStarted: "",
    dateResolved: "",
    isResolved: false,
    priority: "Enlace",
    categories: [], // multi-select init
    attachments: [],
    isManualDate: false
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user")
    if (!savedUser) { router.push("/login"); return }
    const user = JSON.parse(savedUser)

    const now = new Date()
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)

    setFormData(prev => ({
      ...prev,
      operatorId: user.id || "unknown",
      operatorName: user.name,
      operatorEmail: user.email,
      dateStarted: localIso,
      dateResolved: localIso
    }))
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[] | Attachment[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (catId: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(catId)
      const newCats = exists ? prev.categories.filter(c => c !== catId) : [...prev.categories, catId]
      return { ...prev, categories: newCats }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setUploading(true)
    const file = e.target.files[0]
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
      const data = await res.json()
      if (data.success) {
        handleInputChange('attachments', [...formData.attachments, { url: data.url, type: data.type }])
      }
    } catch { alert("Error subiendo archivo") }
    finally { setUploading(false) }
  }

  const fixText = async () => {
    const text = formData.problemDescription.trim()
    if (!text) return
    setFixingText(true)
    try {
      // Simulate or call real API
      const res = await fetch('/api/spellcheck', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (data.correctedText) {
        handleInputChange('problemDescription', data.correctedText)
      }
    } catch {
      // Fallback basic fix
      let basic = text.charAt(0).toUpperCase() + text.slice(1)
      if (!/[.!?]$/.test(basic)) basic += "."
      handleInputChange('problemDescription', basic)
    } finally {
      setFixingText(false)
    }
  }

  const addDuration = (minutes: number) => {
    const start = new Date(formData.dateStarted)
    const end = new Date(start.getTime() + minutes * 60000)
    // Adjust for manual offset viewing
    const localEnd = new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    handleInputChange('dateResolved', localEnd)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        category: formData.categories.join(", "), // Flatten for backend if it expects string
        dateStarted: new Date(formData.dateStarted).toISOString(),
        status: formData.isResolved ? 'resolved' : 'pending',
        dateResolved: formData.isResolved ? new Date(formData.dateResolved).toISOString() : null
      }
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Error")
      setSuccess(true)
    } catch {
      setError("No se pudo guardar el reporte.")
    } finally {
      setLoading(false)
    }
  }

  // --- Components ---

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-[#FF0C60] selection:text-white font-sans flex flex-col md:flex-row relative">
      {/* Ambient Background - Dashboard Style */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
      </div>

      {/* Content wrapper with z-index to sit ABOVE gradient */}
      <div className="relative z-10 flex flex-col md:flex-row w-full h-full">

        {/* Sidebar (Desktop) */}
        <div className="hidden md:flex flex-col w-80 h-screen bg-black/20 backdrop-blur-2xl border-r border-white/5 p-8 fixed left-0 top-0 z-50">
          <Link href="/reportes" className="flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Volver</span>
          </Link>
          <div className="mb-10">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF0C60]/10 text-[#FF0C60] text-xs font-bold mb-4 border border-[#FF0C60]/20">
              NUEVO REPORTE
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500">Crear Incidencia</h1>
            <p className="text-sm text-slate-500 leading-relaxed">Completa los pasos para registrar y asignar el ticket al equipo correspondiente.</p>
          </div>

          {/* Stepper */}
          <div className="space-y-0 relative ml-2">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-4 bottom-10 w-px bg-zinc-800 -z-10" />

            {STEPS.map((s, idx) => {
              const isActive = step === idx
              const isDone = step > idx
              return (
                <div key={idx} className="flex gap-4 pb-8 last:pb-0 group">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 shrink-0",
                    isActive ? "border-[#FF0C60] bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/20 scale-110" :
                      isDone ? "border-[#FF0C60] bg-zinc-950 text-[#FF0C60]" : "border-zinc-800 bg-zinc-950 text-zinc-600"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className={cn("pt-1 transition-all duration-300", isActive ? "opacity-100 translate-x-1" : "opacity-40 group-hover:opacity-60")}>
                    <h3 className="text-sm font-bold text-white leading-none mb-1 tracking-tight">{s.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto">
            <div className="p-4 rounded-xl bg-[#121214] border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">Sistema Operativo</span>
              </div>
              <p className="text-[10px] text-zinc-500">Todos los servicios operando con normalidad.</p>
            </div>
          </div>
        </div>

        {/* Header (Mobile) */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-white/10 z-50 flex items-center justify-between px-4">
          <Link href="/reportes" className="p-2"> <ArrowLeft className="w-5 h-5 text-slate-400" /> </Link>
          <span className="font-bold text-white text-sm tracking-tight">Nuevo Reporte</span>
          <div className="w-9" />
        </div>

        {/* Mobile Stepper (Sub-header) */}
        <div className="md:hidden fixed top-16 left-0 right-0 h-14 bg-black border-b border-white/5 z-40 flex items-center justify-center px-6 gap-8">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                step === idx ? "bg-[#FF0C60] w-6" : step > idx ? "bg-[#FF0C60]" : "bg-zinc-800"
              )} />
              {step === idx && <span className="text-[10px] font-bold text-white absolute -bottom-6">{s.title}</span>}
            </div>
          ))}
        </div>

        {/* Main Content Area - Native Scroll for Mobile / Centered for Desktop */}
        <div className="relative z-10 min-h-screen pt-24 pb-16 md:pt-0 md:pb-0 md:ml-80 md:h-screen md:flex md:flex-col md:justify-center">
          <div className="w-full max-w-5xl mx-auto p-6 md:p-12">
            <form className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <AnimatePresence mode="wait">
                {/* STEP 0: CONTEXT */}
                {step === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10">
                    <section>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Selecciona el Sistema</h2>
                        <p className="text-slate-500 text-sm">Identifica dónde se originó la falla para priorizar el soporte.</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SYSTEMS.map(sys => (
                          <div
                            key={sys.id}
                            onClick={() => handleInputChange('priority', sys.id)}
                            className={cn(
                              "cursor-pointer relative overflow-hidden rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 group active:scale-95 aspect-[4/3] backdrop-blur-md",
                              formData.priority === sys.id
                                ? "border-[#FF0C60] bg-[#FF0C60]/10 shadow-[0_0_20px_-10px_#FF0C60]"
                                : "border-white/5 bg-[#121214]/60 hover:bg-[#121214]/80 hover:border-white/10"
                            )}
                          >
                            {formData.priority === sys.id && (
                              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FF0C60] shadow-[0_0_8px_#FF0C60]" />
                            )}
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300", formData.priority === sys.id ? "bg-[#FF0C60] text-white" : "bg-black text-zinc-600")}>
                              <Server className="w-5 h-5" />
                            </div>
                            <span className={cn("font-bold text-sm tracking-tight", formData.priority === sys.id ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{sys.id}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white tracking-tight mb-1">Categoría Técnica</h2>
                          <p className="text-zinc-500 text-xs">Puedes seleccionar múltiples etiquetas.</p>
                        </div>
                        {formData.categories.length > 0 && <span className="text-[10px] font-bold text-[#FF0C60] px-2 py-0.5 rounded bg-[#FF0C60]/10 border border-[#FF0C60]/20">{formData.categories.length} SELECCIONADAS</span>}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CATEGORIES.map(cat => {
                          const isSelected = formData.categories.includes(cat.id)
                          return (
                            <div
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={cn(
                                "cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-3 group active:scale-[0.98] backdrop-blur-md",
                                isSelected
                                  ? "bg-white text-black shadow-lg border-white"
                                  : "bg-[#121214]/60 border-white/5 text-slate-400 hover:bg-[#121214]/80 hover:border-white/10"
                              )}
                            >
                              <div className={cn("p-1.5 rounded-md transition-colors", isSelected ? "bg-black/10 text-black" : "bg-black/40 text-slate-500 group-hover:text-slate-300")}>
                                {cat.icon}
                              </div>
                              <div className="flex flex-col">
                                <span className={cn("font-bold text-sm", isSelected ? "text-black" : "text-white")}>{cat.id}</span>
                                <span className={cn("text-[10px] font-medium", isSelected ? "text-zinc-600" : "text-zinc-500")}>{cat.desc}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto text-black" />}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  </motion.div>
                )}

                {/* STEP 1: DETAILS */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-6">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Detalle del Incidente</h2>
                            <p className="text-slate-500 text-sm mt-1">Explica el problema con claridad para agilizar la solución.</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={fixText} disabled={fixingText} className="border-white/5 bg-[#121214]/50 hover:bg-[#121214] hover:text-white text-slate-400 h-8 gap-2 text-xs backdrop-blur-md">
                            {fixingText ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#FF0C60]" />}
                            Auto-Mejorar
                          </Button>
                        </div>

                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF0C60] to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur" />
                          <div className="relative bg-[#121214]/60 backdrop-blur-xl rounded-2xl p-1 border border-white/5 focus-within:border-white/10 transition-colors shadow-2xl">
                            <Textarea
                              value={formData.problemDescription}
                              onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                              placeholder="Escribe aquí los detalles..."
                              className="min-h-[300px] bg-transparent border-none text-base p-6 resize-none focus-visible:ring-0 placeholder:text-zinc-700 text-zinc-100 leading-relaxed"
                            />
                            <div className="px-6 pb-4 flex justify-between items-center border-t border-white/5 pt-4">
                              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Soporta Markdown Básico</span>
                              <span className={cn("text-xs font-medium", formData.problemDescription.length > 500 ? "text-emerald-500" : "text-zinc-500")}>
                                {formData.problemDescription.length} caracteres
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                          <Label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Tiempo de Inicio
                          </Label>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleInputChange('isManualDate', false)}
                              className={cn("p-3 rounded-xl border text-sm font-medium transition-all text-left flex justify-between items-center group", !formData.isManualDate ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-white/5 bg-black/20 text-zinc-500 hover:bg-black/40")}
                            >
                              <span>Ahora Mismo</span>
                              <span className="text-xs opacity-50 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInputChange('isManualDate', true)}
                              className={cn("p-3 rounded-xl border text-sm font-medium transition-all text-left", formData.isManualDate ? "border-[#FF0C60]/20 bg-[#FF0C60]/5 text-[#FF0C60]" : "border-white/5 bg-black/20 text-zinc-500 hover:bg-black/40")}
                            >
                              Asignar Pasado
                            </button>
                            <AnimatePresence>
                              {formData.isManualDate && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                  <Input
                                    type="datetime-local"
                                    value={formData.dateStarted}
                                    onChange={(e) => handleInputChange('dateStarted', e.target.value)}
                                    className="bg-black/50 border-white/10 h-10 text-xs mt-2 [color-scheme:dark] text-white focus:border-white/20"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
                          <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20 h-fit">
                              <Info className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-indigo-200 mb-1">Tip de Reporte</h4>
                              <p className="text-xs text-indigo-300/80 leading-relaxed">
                                Incluye códigos de error o capturas de pantalla si es posible. Ayuda a reducir el tiempo de diagnóstico en un 40%.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: EVIDENCE */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Evidencia y Cierre</h2>
                      <p className="text-slate-500 text-sm">Sube fotos o videos para documentar el caso.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6 block">Galería Multimedia</Label>
                        <div className="grid grid-cols-3 gap-4">
                          {formData.attachments.map((file, idx) => (
                            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden bg-black border border-white/10 group">
                              {file.type === 'IMAGE' ? <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><FileVideo /></div>}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => { const n = [...formData.attachments]; n.splice(idx, 1); handleInputChange('attachments', n) }} className="p-2 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-white transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                          <label className="aspect-square rounded-xl border-2 border-dashed border-white/5 hover:border-[#FF0C60] bg-black/20 hover:bg-[#FF0C60]/5 flex flex-col items-center justify-center cursor-pointer transition-all group gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#121214] group-hover:bg-[#FF0C60] flex items-center justify-center transition-colors shadow-lg"> <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" /> </div>
                            <span className="text-[10px] uppercase font-bold text-zinc-600 group-hover:text-[#FF0C60]">Subir Archivo</span>
                            <input type="file" multiple hidden onChange={handleFileUpload} disabled={uploading} />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                          <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6 block">Estado del Caso</Label>

                          <div
                            className={cn("p-4 rounded-xl border transition-all cursor-pointer mb-4", formData.isResolved ? "bg-emerald-950/30 border-emerald-500/30" : "bg-black/20 border-white/5 hover:bg-black/40")}
                            onClick={() => handleInputChange('isResolved', !formData.isResolved)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors", formData.isResolved ? "bg-emerald-500 border-emerald-500" : "border-zinc-600")}>
                                {formData.isResolved && <CheckCircle2 className="w-3 h-3 text-black" />}
                              </div>
                              <div className="flex-1">
                                <span className={cn("font-bold text-sm block", formData.isResolved ? "text-emerald-400" : "text-white")}>Marcar como Resuelto</span>
                                <span className="text-xs text-zinc-500">¿El incidente ha sido solucionado?</span>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {formData.isResolved && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                <div className="pl-2 border-l-2 border-emerald-500/20 ml-2 mt-2 pt-2">
                                  <Label className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-wider mb-3 block">Tiempo Estimado</Label>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {[5, 15, 30, 60].map(m => (
                                      <button key={m} type="button" onClick={() => addDuration(m)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">+{m} min</button>
                                    ))}
                                  </div>
                                  <Input
                                    type="datetime-local"
                                    value={formData.dateResolved}
                                    onChange={(e) => handleInputChange('dateResolved', e.target.value)}
                                    className="bg-black border-emerald-500/20 text-emerald-100 h-10 rounded-lg text-xs [color-scheme:dark]"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>



          {error && <div className="absolute top-24 right-8 bg-rose-500/10 border border-rose-500 text-rose-500 px-4 py-2 rounded-lg backdrop-blur-md z-50 animate-in slide-in-from-right">{error}</div>}
        </div>

        {/* Fixed Footer (Portal to Body for Guaranteed Fix) */}
        {mounted && createPortal(
          <div className="fixed bottom-0 left-0 md:left-80 right-0 p-4 md:p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between z-[9999]">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="text-slate-400 hover:text-white hover:bg-white/5">
              <ChevronLeft className="w-5 h-5 mr-2" /> Atrás
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 hidden md:inline-block">Paso {step + 1} de 3</span>
              {step < 2 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && formData.categories.length === 0} className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-[#FF0C60] hover:bg-[#D90A50] text-white font-bold shadow-lg shadow-[#FF0C60]/20 transition-transform active:scale-95">
                  Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-white hover:bg-zinc-200 text-black font-bold shadow-lg shadow-white/10 transition-transform active:scale-95">
                  {loading ? "Enviando..." : "Crear Reporte"} <Send className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>,
          document.body
        )}

        <SuccessModal
          isOpen={success}
          onClose={() => {
            setSuccess(false);
            router.push('/reportes');
          }}
          title="Reporte Creado"
          message="La incidencia ha sido registrada correctamente. Te enviaré a la pantalla de reportes."
        />

      </div>
    </div>
  )
}
