"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // 2FA State
  const [loginStep, setLoginStep] = useState<'credentials' | 'pin'>('credentials')
  const [pin, setPin] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tempUserData, setTempUserData] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setLoading(false)
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (pin === "1111") {
      // Success!
      localStorage.setItem("enlace-user", JSON.stringify(tempUserData))
      window.location.href = "/"
    } else {
      setError("PIN incorrecto. Inténtalo de nuevo.")
      setPin("")
      setLoading(false)
      // Focus logic isn't strictly needed if we clear input, but good UX would be to focus it back.
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#050505] selection:bg-[#FF0C60] selection:text-white">

      {/* --- Left Panel: Visual/Creative --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A0A0A]">
        {/* Animated Aurora Background */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#FF0C60]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '5000ms' }} />
        </div>

        {/* Noise overlay texture */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Content */}
        <div className="relative z-10 p-20 flex flex-col justify-between h-full w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"
          >
            <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-10 h-10 object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              Control <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#FF0C60]">Máster.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md leading-relaxed">
              Sistema integral de gestión de operaciones, monitoreo y reportes para Enlace Canal 23.
            </p>
          </motion.div>

          <div className="text-slate-500 text-sm font-medium">
            &copy; 2025 Enlace Internacional
          </div>
        </div>
      </div>

      {/* --- Right Panel: Form/Functional --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="lg:hidden mb-10 text-center">
            <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Control Máster</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {loginStep === 'credentials' ? 'Bienvenido de nuevo' : 'Verificación requerida'}
            </h2>
            <p className="text-slate-400 mt-2">
              {loginStep === 'credentials'
                ? 'Ingresa tus credenciales para acceder al panel.'
                : 'Ingresa el PIN de seguridad para continuar.'}
            </p>
          </div>

          <form onSubmit={loginStep === 'credentials' ? handleLogin : handlePinSubmit} className="space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 border-l-4 border-red-500 text-red-200 p-4 rounded-r text-sm font-medium">
                {error}
              </motion.div>
            )}

            {loginStep === 'credentials' ? (
              <motion.div
                key="credentials-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-slate-300 group-focus-within:text-blue-400 transition-colors">Correo Electrónico</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-[#101012] border-white/10 rounded-xl text-lg px-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-white placeholder:text-slate-600"
                    placeholder="nombre@enlace.org"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300 group-focus-within:text-blue-400 transition-colors">Contraseña</label>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 bg-[#101012] border-white/10 rounded-xl text-lg px-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-white pr-12 placeholder:text-slate-600"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pin-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-slate-300 group-focus-within:text-blue-400 transition-colors">Código PIN</label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 4) {
                        setPin(val);
                      }
                    }}
                    className="h-14 bg-[#101012] border-white/10 rounded-xl text-lg px-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-white placeholder:text-slate-600 text-center tracking-[1em]"
                    placeholder="••••"
                    required
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-xl text-lg font-bold shadow-lg shadow-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>
                {loginStep === 'credentials' ? 'Continuar' : 'Verificar'}
                <ArrowRight className="w-5 h-5" />
              </>}
            </Button>

            {loginStep === 'pin' && (
              <button
                type="button"
                onClick={() => {
                  setLoginStep('credentials')
                  setPin("")
                  setError("")
                }}
                className="w-full text-slate-500 hover:text-white text-sm transition-colors"
              >
                Volver al inicio de sesión
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
