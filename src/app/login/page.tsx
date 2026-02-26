"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus, LogIn, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BackgroundShapes from "./BackgroundShapes";
import { toast } from "sonner";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regCode, setRegCode] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos", {
        description: "Ingresa tu correo y contraseña para continuar."
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      localStorage.setItem("enlace-user", JSON.stringify(data));
      toast.success(`¡Bienvenido de vuelta, ${data.name?.split(' ')[0] || 'usuario'}!`, {
        description: "Sesión iniciada correctamente."
      });
      setTimeout(() => { window.location.href = "/"; }, 800);

    } catch (err) {
      toast.error("Error de autenticación", {
        description: err instanceof Error ? err.message : "Error al iniciar sesión"
      });
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regName || !regEmail || !regPassword || !regConfirmPassword || !regCode) {
      toast.error("Campos incompletos", {
        description: "Todos los campos son obligatorios para registrarse."
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Las contraseñas no coinciden", {
        description: "Verifica que ambas contraseñas sean iguales."
      });
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Contraseña muy corta", {
        description: "La contraseña debe tener al menos 6 caracteres."
      });
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
          securityCode: regCode,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrarse");

      toast.success("¡Registro exitoso!", {
        description: `Bienvenido ${data.name}. Iniciando sesión...`
      });

      // Auto-login after registration
      localStorage.setItem("enlace-user", JSON.stringify(data));
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (err) {
      toast.error("Error de registro", {
        description: err instanceof Error ? err.message : "Error al registrarse"
      });
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center selection:bg-[#FF0C60] selection:text-white relative overflow-hidden bg-[#f8fafc] dark:bg-background text-foreground p-3 sm:p-8 transition-colors duration-500">

      <div className="absolute inset-0 z-0">
        <BackgroundShapes />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[980px] md:min-h-[600px] flex flex-col md:flex-row relative z-10 bg-white dark:bg-card rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/5 transition-all duration-500"
      >

        {/* Left Panel - Branding */}
        <div className="hidden md:flex w-full md:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-[#181825] dark:via-[#0d0d14] dark:to-[#040405] flex-col justify-end p-10 sm:p-14 border-r border-slate-100 dark:border-white/5 transition-colors duration-500">

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

          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
        </div>

        {/* Right Panel - Form */}
        <div className="w-full md:w-[55%] flex flex-col justify-center p-6 sm:p-10 md:p-14 lg:p-20 relative bg-white dark:bg-card transition-colors duration-500">
          <div className="max-w-[360px] w-full mx-auto space-y-8 sm:space-y-10">

            {/* Tab Switcher */}
            <div className="space-y-6">
              <div className="flex bg-slate-100 dark:bg-zinc-900/60 p-1 rounded-lg border border-slate-200 dark:border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'login'
                    ? 'bg-white dark:bg-card text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'
                    }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Ingresar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'register'
                    ? 'bg-white dark:bg-card text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'
                    }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Registro
                </button>
              </div>
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3 mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Acceso Seguro
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Identifíquese con su correo o perfil para acceder.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} noValidate className="space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Correo o Perfil
                        </label>
                        <Input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 bg-slate-50 border-slate-200 rounded-md px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                          placeholder="usuario@enlace.org o usuario"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Contraseña
                        </label>
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
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-[#FF0C60] hover:bg-[#e60b57] text-white rounded-md text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-500/10 active:scale-[0.98] transition-all duration-300 border-0"
                      >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Ingresar al sistema'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3 mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Primer Acceso
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Regístrese con el código de seguridad proporcionado.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} noValidate className="space-y-5">
                    <div className="space-y-4">
                      {/* Security Code - Prominent */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold text-[#FF0C60] uppercase tracking-widest px-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          Código de Seguridad
                        </label>
                        <Input
                          type="text"
                          value={regCode}
                          onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          className="h-14 bg-[#FF0C60]/[0.03] border-[#FF0C60]/20 rounded-md px-5 text-sm font-mono tracking-[0.3em] text-center focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 placeholder:tracking-[0.3em] shadow-none dark:bg-[#FF0C60]/[0.05] dark:border-[#FF0C60]/10 dark:text-foreground"
                          placeholder="XXXXXXXX"
                        />
                        <p className="text-[9px] text-slate-400 dark:text-white/25 font-medium px-1">
                          Solicítelo al administrador del sistema.
                        </p>
                      </div>

                      {/* Name */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Nombre Completo
                        </label>
                        <Input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 rounded-md px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                          placeholder="Ej. Juan Pérez"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Correo Corporativo
                        </label>
                        <Input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 rounded-md px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                          placeholder="usuario@enlace.org"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Contraseña
                        </label>
                        <div className="relative">
                          <Input
                            type={showRegPassword ? "text" : "password"}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="h-12 bg-slate-50 border-slate-200 rounded-md px-5 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                            placeholder="Mínimo 6 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2 dark:text-muted-foreground dark:hover:text-foreground"
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">
                          Confirmar Contraseña
                        </label>
                        <Input
                          type="password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 rounded-md px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#FF0C60] transition-all text-slate-900 placeholder:text-slate-300 shadow-none dark:bg-zinc-900/40 dark:border-white/[0.03] dark:text-foreground"
                          placeholder="Repetir contraseña"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={regLoading}
                        className="w-full h-14 bg-[#FF0C60] hover:bg-[#e60b57] text-white rounded-md text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-500/10 active:scale-[0.98] transition-all duration-300 border-0"
                      >
                        {regLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Crear mi cuenta'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="pt-10 border-t border-slate-100 dark:border-white/[0.03] flex flex-col items-center gap-4">
              <p className="text-zinc-700 text-[9px] font-black tracking-[0.5em] uppercase text-center opacity-50">
                EST. 1988 • ENLACE TV INTERNACIONAL
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}