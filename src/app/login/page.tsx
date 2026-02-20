"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import BackgroundShapes from "./BackgroundShapes"

import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 2FA State
  const [loginStep, setLoginStep] = useState<'credentials' | 'pin'>('credentials')
  const [pin, setPin] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tempUserData, setTempUserData] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Por favor completa todos los campos", {
        description: "Ingresa tu correo y contraseña para continuar."
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión")

      // Skip PIN for Engineers
      if (data.role === 'ENGINEER') {
        localStorage.setItem("enlace-user", JSON.stringify(data))
        window.location.href = "/"
        return
      }

      // Instead of immediate redirect, move to 2FA step
      setTempUserData(data)
      setLoginStep('pin')
      setLoading(false)

    } catch (err) {
      toast.error("Error de autenticación", {
        description: err instanceof Error ? err.message : "Error al iniciar sesión"
      })
      setLoading(false)
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (pin.length < 4) {
      toast.error("PIN Incompleto", {
        description: "Por favor ingresa el código de 4 dígitos."
      })
      return
    }

    setLoading(true)

    if (pin === "1111") {
      // Success!
      localStorage.setItem("enlace-user", JSON.stringify(tempUserData))
      window.location.href = "/"
    } else {
      toast.error("Código Incorrecto", {
        description: "El PIN ingresado no es válido."
      })
      setPin("")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center selection:bg-[#FF0C60] selection:text-white relative overflow-hidden bg-[#f8fafc] dark:bg-background text-foreground p-4 sm:p-8 transition-colors duration-500">
      {/* Global Background Layer */}
      <div className="absolute inset-0 z-0">
        <BackgroundShapes />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[980px] min-h-[600px] flex flex-col md:flex-row relative z-10 bg-white dark:bg-card rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/5 transition-all duration-500"
      >
        {/* --- Left Section: Hero Visual --- */}
        <div className="w-full md:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-[#181825] dark:via-[#0d0d14] dark:to-[#040405] flex flex-col justify-end p-10 sm:p-14 border-r border-slate-100 dark:border-white/5 transition-colors duration-500">
          {/* Subtle glowing elements in the background */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#FF0C60]/10 rounded-full blur-[120px] opacity-40 dark:opacity-100" />
          <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] opacity-60 dark:opacity-100" />

          <div className="relative z-10 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-16 h-16 rounded-xl bg-white/80 border border-slate-200 dark:bg-white/5 dark:border-white/10 flex items-center justify-center backdrop-blur-md mb-8 shadow-sm dark:shadow-inner"
            >
              <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-10 h-10 object-contain" />
            </motion.div>

            <div className="space-y-1">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white leading-[0.85]">
                Control<br />
                <span className="text-[#FF0C60]">Master</span>
              </h1>
              <p className="text-[11px] font-semibold tracking-[0.4em] text-slate-400 dark:text-white/30 uppercase pt-2">
                Enlace, Canal 23
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-[280px] leading-relaxed pt-4">
              Terminal de acceso centralizado para el monitoreo y gestión técnica de red.
            </p>
          </div>

          {/* Technical dots overlay */}
          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
        </div>

        {/* --- Right Section: Form --- */}
        <div className="w-full md:w-[55%] flex flex-col justify-center p-10 sm:p-14 lg:p-20 relative bg-white dark:bg-card transition-colors duration-500">
          <div className="max-w-[360px] w-full mx-auto space-y-12">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {loginStep === 'credentials' ? 'Acceso Seguro' : 'Validación PIN'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {loginStep === 'credentials'
                  ? 'Identifíquese con su correo o perfil para acceder.'
                  : 'Ingrese su código de seguridad de 4 dígitos.'}
              </p>
            </div>

            <form onSubmit={loginStep === 'credentials' ? handleLogin : handlePinSubmit} noValidate className="space-y-8">
              <AnimatePresence mode="wait">
                {loginStep === 'credentials' ? (
                  <motion.div
                    key="credentials"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">Correo o Perfil</label>
                      <Input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 bg-slate-50 border-slate-200 rounded-md px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                        placeholder="usuario@enlace.org o usuario"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Contraseña</label>
                        <button type="button" className="text-[9px] font-bold text-[#FF0C60]/70 hover:text-[#FF0C60] transition-colors uppercase tracking-widest">¿Olvido su clave?</button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-14 bg-slate-50 border-slate-200 rounded-md px-5 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2 dark:text-muted-foreground dark:hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-10"
                  >
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-1 bg-[#FF0C60]/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#FF0C60]"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#FF0C60] uppercase tracking-[0.4em]">Estación Blindada</span>
                    </div>
                    <Input
                      type="password"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val) && val.length <= 4) setPin(val);
                      }}
                      className="h-20 bg-slate-50 border-slate-200 rounded-md text-5xl text-center tracking-[0.4em] text-slate-900 focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all placeholder:text-slate-200 dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                      placeholder="0000"
                      autoFocus
                    />
                    <p className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Solo personal de ingeniería autorizado.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-6 flex flex-col gap-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#FF0C60] hover:bg-[#e60b57] text-white rounded-md text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-500/10 active:scale-[0.98] transition-all duration-300 border-0"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-6 h-6" />
                  ) : (
                    loginStep === 'credentials' ? 'Ingresar al sistema' : 'Validar Identidad'
                  )}
                </Button>

                {loginStep === 'pin' && (
                  <button
                    type="button"
                    onClick={() => { setLoginStep('credentials'); setPin(""); }}
                    className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors text-center dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    ← Volver Atrás
                  </button>
                )}
              </div>
            </form>

            <div className="pt-14 border-t border-white/[0.03] flex flex-col items-center gap-4">
              <p className="text-zinc-700 text-[9px] font-black tracking-[0.5em] uppercase text-center opacity-50">
                EST. 1988 &bull; ENLACE TV INTERNACIONAL
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
