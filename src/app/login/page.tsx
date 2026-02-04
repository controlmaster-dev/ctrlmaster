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
    <div className="min-h-screen w-full flex bg-[#050505] selection:bg-[#FF0C60] selection:text-white relative overflow-hidden font-sans">

      {/* Shared Background */}
      <BackgroundShapes />

      {/* --- Desktop Left Panel: Brand --- */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-24 flex-col justify-center h-full min-h-screen border-r border-white/[0.05] bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] mb-12 shadow-2xl backdrop-blur-md">
            <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>

          <h1 className="text-8xl font-bold text-white tracking-tighter mb-8 leading-[0.9]">
            Control <br />
            <span className="text-[#FF0C60]">Máster.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light tracking-wide">
            Suite de operaciones de próxima generación para Enlace Canal 23.
          </p>
        </motion.div>
      </div>

      {/* --- Right Panel: Login Form --- */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative z-20">

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[400px] flex flex-col gap-8"
        >
          {/* Mobile Logo Integrated in Flow */}
          <div className="lg:hidden flex flex-col items-center gap-6 mb-2">
            <div className="w-20 h-20 rounded-3xl bg-[#ffffff05] border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white tracking-tighter">
                Control <span className="text-[#FF0C60]">Máster</span>
              </h1>
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {loginStep === 'credentials' ? 'Bienvenido' : 'Seguridad'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {loginStep === 'credentials' ? 'Ingresa a la plataforma.' : 'Confirma tu identidad.'}
            </p>
          </div>

          <form onSubmit={loginStep === 'credentials' ? handleLogin : handlePinSubmit} className="space-y-6">

            <div className="space-y-5">
              <AnimatePresence mode="wait">
                {loginStep === 'credentials' ? (
                  <motion.div
                    key="credentials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Correo de Enlace</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 bg-[#121214] border-white/5 rounded-xl px-5 text-base focus-visible:ring-2 focus-visible:ring-[#FF0C60]/50 border-transparent transition-all text-white placeholder:text-slate-700 shadow-inner"
                        placeholder="usuario@enlace.org"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-14 bg-[#121214] border-white/5 rounded-xl px-5 text-base focus-visible:ring-2 focus-visible:ring-[#FF0C60]/50 border-transparent transition-all text-white placeholder:text-slate-700 pr-12 shadow-inner"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-2">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block text-center mb-4">Código de Acceso</label>
                    <Input
                      type="password"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val) && val.length <= 4) setPin(val);
                      }}
                      className="h-20 bg-[#121214] border-white/5 rounded-2xl text-4xl text-center tracking-[0.5em] text-white focus-visible:ring-2 focus-visible:ring-[#FF0C60]/50 transition-all placeholder:text-slate-800 shadow-inner"
                      placeholder="••••"
                      autoFocus
                    />
                    <div className="flex justify-center gap-2">
                      <p className="text-xs text-slate-600 font-medium">Ingresa los 4 dígitos de tu PIN.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[#FF0C60] to-[#C90045] hover:brightness-110 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(255,12,96,0.5)] hover:shadow-[0_0_40px_-5px_rgba(255,12,96,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  loginStep === 'credentials' ? 'Iniciar Sesión' : 'Verificar'
                )}
              </Button>

              {loginStep === 'pin' && (
                <button
                  type="button"
                  onClick={() => { setLoginStep('credentials'); setPin(""); }}
                  className="w-full mt-4 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors py-2"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </motion.div>

        <div className="absolute bottom-6 w-full text-center lg:hidden">
          <p className="text-slate-800 text-[10px] font-bold tracking-[0.3em] uppercase">
            Enlace Internacional &copy; 1988 - 2026
          </p>
        </div>
      </div>
    </div>
  )
}
