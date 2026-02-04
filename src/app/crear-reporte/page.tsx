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
import BackgroundShapes from "@/app/login/BackgroundShapes"
import { toast } from "sonner"

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
  categories: string[]
  attachments: Attachment[]
  isManualDate: boolean
}

const CATEGORIES = [
  { id: "Transmisión", icon: <Radio className="w-5 h-5" />, desc: "Señal aire/satélite" },
  { id: "Audio", icon: <Activity className="w-5 h-5" />, desc: "Niveles, ruidos" },
  { id: "Video", icon: <MonitorPlay className="w-5 h-5" />, desc: "Calidad imagen" },
  { id: "Equipos", icon: <Server className="w-5 h-5" />, desc: "Hardware físico" },
  { id: "Software", icon: <Activity className="w-5 h-5" />, desc: "Apps, SO" },
  { id: "Falla Energética", icon: <Zap className="w-5 h-5" />, desc: "UPS, Planta" },
  { id: "Otros", icon: <Info className="w-5 h-5" />, desc: "General" }
]

const SYSTEMS = [
  { id: "Enlace", color: "from-blue-600 to-blue-400" },
  { id: "EJTV", color: "from-orange-500 to-amber-400" },
  { id: "Enlace USA", color: "from-red-600 to-red-400" },
  { id: "Todos", color: "from-purple-600 to-pink-400" }
]

const STEPS = [
  { id: 0, title: "CONTEXTO", desc: "Sistema y tipo de falla" },
  { id: 1, title: "DETALLES", desc: "Qué, cuándo y dónde" },
  { id: 2, title: "EVIDENCIA", desc: "Fotos y finalizar" }
]

export default function CreateReportPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    categories: [],
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
        category: formData.categories.join(", "),
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
      toast.error("No se pudo guardar el reporte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#050505] selection:bg-[#FF0C60] selection:text-white relative overflow-hidden font-sans text-slate-200">

      {/* Shared Background */}
      <BackgroundShapes />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col md:flex-row w-full h-full">

        {/* --- Left Sidebar (Context) --- */}
        <div className="hidden md:flex flex-col w-96 h-screen bg-black/20 backdrop-blur-2xl border-r border-white/[0.05] p-10 fixed left-0 top-0 z-50">
          <Link href="/reportes" className="flex items-center gap-3 text-slate-400 hover:text-white mb-12 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-wide">VOLVER</span>
          </Link>

          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF0C60]/10 text-[#FF0C60] text-[10px] font-black tracking-widest uppercase mb-6 border border-[#FF0C60]/20 shadow-[0_0_20px_-5px_rgba(255,12,96,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF0C60] animate-pulse"></span>
              Nuevo Reporte
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tighter mb-4 leading-tight">Crear <span className="text-slate-500">Incidencia</span></h1>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">Registra, categoriza y asigna tickets de soporte de manera eficiente.</p>
          </div>

          {/* Stepper */}
          <div className="space-y-0 relative ml-2">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-4 bottom-10 w-px bg-white/10 -z-10" />

            {STEPS.map((s, idx) => {
              const isActive = step === idx
              const isDone = step > idx
              return (
                <div key={idx} className="flex gap-6 pb-10 last:pb-0 group relative">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 shrink-0",
                    isActive ? "border-[#FF0C60] bg-[#FF0C60] text-white shadow-[0_0_20px_rgba(255,12,96,0.4)] scale-110" :
                      isDone ? "border-[#FF0C60] bg-black text-[#FF0C60]" : "border-white/10 bg-black text-slate-600"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className={cn("pt-1 transition-all duration-300", isActive ? "opacity-100 translate-x-1" : "opacity-40 group-hover:opacity-60")}>
                    <h3 className="text-sm font-bold text-white leading-none mb-1.5 tracking-wide uppercase">{s.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Estado del Sistema</span>
              </div>
              <p className="text-[10px] text-zinc-500">Todos los servicios operando con normalidad.</p>
            </div>
          </div>
        </div>

        {/* --- Mobile Header --- */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
          <Link href="/reportes" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5"> <ArrowLeft className="w-5 h-5 text-slate-200" /> </Link>
          <span className="font-bold text-white text-sm tracking-tight uppercase">Nuevo Reporte</span>
          <div className="w-10" />
        </div>

        {/* --- Mobile Stepper --- */}
        <div className="md:hidden fixed top-16 left-0 right-0 h-14 bg-black/60 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-center px-6 gap-2">
          {STEPS.map((_, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-1 rounded-full transition-all w-full",
                step >= idx ? "bg-[#FF0C60] shadow-[0_0_10px_rgba(255,12,96,0.3)]" : "bg-white/10"
              )} />
            </div>
          ))}
        </div>

        {/* --- Main Content --- */}
        <div className="relative z-10 w-full min-h-screen pt-32 pb-32 md:pt-32 md:pb-12 md:ml-96 md:h-screen overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto p-6 md:p-16">
            <form className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <AnimatePresence mode="wait">

                {/* STEP 0: CONTEXT */}
                {step === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
                    <section>
                      <div className="mb-8 pl-1">
                        <h2 className="text-3xl font-bold text-white tracking-tighter mb-3">Selecciona el Sistema</h2>
                        <p className="text-slate-400 text-sm font-medium">Identifica dónde se originó la falla para priorizar el soporte.</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SYSTEMS.map(sys => {
                          const isActive = formData.priority === sys.id
                          return (
                            <div
                              key={sys.id}
                              onClick={() => handleInputChange('priority', sys.id)}
                              className={cn(
                                "cursor-pointer relative overflow-hidden rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 group active:scale-95 aspect-[4/3]",
                                isActive
                                  ? "border-[#FF0C60] bg-[#FF0C60]/5 shadow-[0_0_40px_-10px_rgba(255,12,96,0.3)]"
                                  : "border-zinc-800 bg-[#09090b] hover:border-zinc-700 hover:bg-zinc-900"
                              )}
                            >
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                isActive ? "bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/40 scale-110" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                              )}>
                                <Server className="w-5 h-5" />
                              </div>
                              <span className={cn("font-bold text-xs tracking-widest uppercase transition-colors", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")}>{sys.id}</span>

                              {/* Active Corner Accent */}
                              {isActive && (
                                <div className="absolute top-0 right-0 w-8 h-8">
                                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-l-[32px] border-t-[#FF0C60] border-l-transparent" />
                                  <CheckCircle2 className="w-3 h-3 text-white absolute top-1 right-1" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>

                    <section>
                      <div className="mb-6 flex items-center justify-between pl-1">
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight mb-1">Categoría Técnica</h2>
                          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Múltiples opciones permitidas</p>
                        </div>
                        {formData.categories.length > 0 && (
                          <span className="text-[10px] font-bold text-[#FF0C60] px-3 py-1 rounded-full bg-[#FF0C60]/10 border border-[#FF0C60]/20 shadow-[0_0_15px_-5px_#FF0C60]">
                            {formData.categories.length} SELECCIONADAS
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CATEGORIES.map(cat => {
                          const isSelected = formData.categories.includes(cat.id)
                          return (
                            <div
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={cn(
                                "cursor-pointer py-4 px-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group active:scale-[0.98] relative overflow-hidden",
                                isSelected
                                  ? "border-zinc-200 bg-white text-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)]"
                                  : "border-zinc-800 bg-[#09090b] text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300"
                              )}
                            >
                              <div className={cn("p-2 rounded-lg transition-colors", isSelected ? "bg-black/10 text-black" : "bg-black/40 text-zinc-600 group-hover:text-zinc-400")}>
                                {cat.icon}
                              </div>
                              <div className="flex flex-col relative z-10">
                                <span className={cn("font-bold text-sm tracking-tight transition-colors", isSelected ? "text-black" : "text-zinc-200")}>{cat.id}</span>
                                <span className={cn("text-[10px] font-medium tracking-wide transition-colors", isSelected ? "text-zinc-600" : "text-zinc-600 group-hover:text-zinc-500")}>{cat.desc}</span>
                              </div>
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
                        <div className="flex justify-between items-end mb-2 pl-1">
                          <div>
                            <h2 className="text-3xl font-bold text-white tracking-tighter">Detalle del Incidente</h2>
                            <p className="text-slate-400 text-sm font-medium mt-1">Describe el problema con precisión.</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={fixText} disabled={fixingText} className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-slate-400 h-9 gap-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md rounded-lg">
                            {fixingText ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#FF0C60]" />}
                            Auto-Mejorar
                          </Button>
                        </div>

                        <div className="relative group">
                          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FF0C60] to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-50 transition-opacity duration-500 blur-sm" />
                          <div className="relative bg-[#0A0A0C] rounded-2xl p-1 border border-white/10 focus-within:border-transparent transition-colors shadow-2xl">
                            <Textarea
                              value={formData.problemDescription}
                              onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                              placeholder="Escribe aquí los detalles del fallo..."
                              className="min-h-[300px] bg-transparent border-none text-base p-6 resize-none focus-visible:ring-0 placeholder:text-zinc-700 text-zinc-200 leading-relaxed font-light"
                            />
                            <div className="px-6 pb-4 flex justify-between items-center border-t border-white/5 pt-4">
                              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Soporta Markdown Básico</span>
                              <span className={cn("text-xs font-bold font-mono", formData.problemDescription.length > 500 ? "text-emerald-500" : "text-zinc-600")}>
                                {formData.problemDescription.length} / chars
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm">
                          <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#FF0C60]" /> Tiempo de Inicio
                          </Label>

                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => handleInputChange('isManualDate', false)}
                              className={cn("p-3.5 rounded-xl border text-sm font-bold transition-all text-left flex justify-between items-center group", !formData.isManualDate ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]" : "border-white/5 bg-black/20 text-zinc-500 hover:bg-black/40")}
                            >
                              <span className="tracking-tight">Ahora Mismo</span>
                              <span className="text-[10px] opacity-60 font-mono bg-black/30 px-2 py-0.5 rounded">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInputChange('isManualDate', true)}
                              className={cn("p-3.5 rounded-xl border text-sm font-bold transition-all text-left", formData.isManualDate ? "border-[#FF0C60]/30 bg-[#FF0C60]/10 text-[#FF0C60] shadow-[0_0_15px_-5px_rgba(255,12,96,0.2)]" : "border-white/5 bg-black/20 text-zinc-500 hover:bg-black/40")}
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
                                    className="bg-black/50 border-white/10 h-10 text-xs mt-2 [color-scheme:dark] text-white focus:border-[#FF0C60]/50 transition-colors"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FF0C60]/5 to-purple-600/5 border border-white/5">
                          <div className="flex gap-4">
                            <div className="p-2.5 rounded-xl bg-white/5 h-fit border border-white/5">
                              <Info className="w-4 h-4 text-slate-300" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white mb-1.5 uppercase tracking-wide">Tip de Reporte</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                Incluir códigos de error reduce el tiempo de diagnóstico en un <span className="text-[#FF0C60]">40%</span>.
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
                    <div className="pl-1">
                      <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">Evidencia y Cierre</h2>
                      <p className="text-slate-400 text-sm font-medium">Sube fotos o videos para documentar el caso.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm">
                        <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 block">Galería Multimedia</Label>
                        <div className="grid grid-cols-3 gap-4">
                          {formData.attachments.map((file, idx) => (
                            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden bg-black border border-white/10 group shadow-lg">
                              {file.type === 'IMAGE' ? <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><FileVideo /></div>}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => { const n = [...formData.attachments]; n.splice(idx, 1); handleInputChange('attachments', n) }} className="p-2 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-white transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                          <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF0C60] bg-white/[0.02] hover:bg-[#FF0C60]/5 flex flex-col items-center justify-center cursor-pointer transition-all group gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#FF0C60] flex items-center justify-center transition-colors shadow-lg"> <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" /> </div>
                            <span className="text-[9px] uppercase font-bold text-zinc-500 group-hover:text-[#FF0C60] tracking-widest">Subir</span>
                            <input type="file" multiple hidden onChange={handleFileUpload} disabled={uploading} />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm">
                          <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 block">Estado del Caso</Label>

                          <div
                            className={cn("p-5 rounded-xl border transition-all cursor-pointer mb-6", formData.isResolved ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]" : "bg-black/20 border-white/5 hover:bg-black/40")}
                            onClick={() => handleInputChange('isResolved', !formData.isResolved)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all", formData.isResolved ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30" : "border-zinc-700 bg-black")}>
                                {formData.isResolved && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                              </div>
                              <div className="flex-1">
                                <span className={cn("font-bold text-base block tracking-tight", formData.isResolved ? "text-emerald-400" : "text-white")}>Marcar como Resuelto</span>
                                <span className="text-xs text-zinc-500 font-medium">¿El incidente ha sido solucionado?</span>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {formData.isResolved && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                <div className="pl-4 border-l-2 border-emerald-500/20 ml-3 py-2">
                                  <Label className="text-emerald-500/70 text-[10px] font-black uppercase tracking-wider mb-3 block">Tiempo Estimado</Label>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {[5, 15, 30, 60].map(m => (
                                      <button key={m} type="button" onClick={() => addDuration(m)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors uppercase tracking-wide">+{m} min</button>
                                    ))}
                                  </div>
                                  <Input
                                    type="datetime-local"
                                    value={formData.dateResolved}
                                    onChange={(e) => handleInputChange('dateResolved', e.target.value)}
                                    className="bg-black/50 border-emerald-500/20 text-emerald-100 h-11 rounded-xl text-xs [color-scheme:dark] shadow-inner"
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
        </div>

        {/* Fixed Footer */}
        {mounted && createPortal(
          <div className="fixed bottom-0 left-0 md:left-96 right-0 p-5 bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-[9999]">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="text-slate-400 hover:text-white hover:bg-white/5 uppercase text-xs font-bold tracking-widest">
              <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>

            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden md:inline-block">Paso {step + 1} de 3</span>
              {step < 2 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && formData.categories.length === 0} className="h-12 px-8 rounded-xl bg-[#FF0C60] hover:bg-[#D90A50] text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(255,12,96,0.4)] transition-all hover:scale-105 active:scale-95">
                  Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="h-12 px-8 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95">
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
          title="REPORTE CREADO"
          message="La incidencia ha sido registrada correctamente. Redirigiendo a reportes..."
        />

      </div>
    </div>
  )
}
