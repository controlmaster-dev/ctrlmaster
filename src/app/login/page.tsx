"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 rounded-xl border-border/60 bg-muted/30 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-brand";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        description: "Ingresa tu correo y contraseña para continuar.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      localStorage.setItem("enlace-user", JSON.stringify(data));

      toast.success(`¡Bienvenido de vuelta, ${data.name?.split(" ")[0] || "usuario"}!`, {
        description: "Sesión iniciada correctamente.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      toast.error("Error de autenticación", {
        description: err instanceof Error ? err.message : "Error al iniciar sesión",
      });
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regName || !regEmail || !regPassword || !regConfirmPassword || !regCode) {
      toast.error("Campos incompletos", {
        description: "Todos los campos son obligatorios para registrarse.",
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Las contraseñas no coinciden", {
        description: "Verifica que ambas contraseñas sean iguales.",
      });
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Contraseña muy corta", {
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
          securityCode: regCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrarse");

      toast.success("¡Registro exitoso!", {
        description: `Bienvenido ${data.name}. Iniciando sesión...`,
      });

      localStorage.setItem("enlace-user", JSON.stringify(data));
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      toast.error("Error de registro", {
        description: err instanceof Error ? err.message : "Error al registrarse",
      });
      setRegLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col text-foreground selection:bg-brand selection:text-white lg:flex-row">
      {/* ── Left: marca ── */}
      <section className="relative hidden flex-col justify-center overflow-hidden border-border/50 bg-muted/20 lg:flex lg:min-h-screen lg:w-[44%] lg:border-r lg:p-14 xl:p-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/15 blur-[90px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Image
            src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
            alt="Control Master"
            width={48}
            height={48}
            className="mb-6 h-12 w-12 object-contain"
            priority
          />

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Control <span className="text-brand">Master</span>
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">Enlace TV · Canal 23</p>
        </motion.div>
      </section>

      {/* ── Right: form (full panel, no outer card) ── */}
      <section className="flex flex-1 flex-col justify-center bg-background px-6 py-10 sm:px-12 lg:px-16 xl:px-20">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-[420px]"
        >
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image
              src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <p className="text-lg font-semibold">
              Control <span className="text-brand">Master</span>
            </p>
          </div>

          <div
            role="tablist"
            className="mb-8 flex rounded-xl border border-border/60 bg-muted/25 p-1"
          >
            {(
              [
                { id: "login" as const, label: "Ingresar" },
                { id: "register" as const, label: "Registro" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-7 hidden lg:block">
                  <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Usa el correo o usuario que te asignaron.
                  </p>
                </div>

                <form onSubmit={handleLogin} noValidate className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Correo o usuario
                    </Label>
                    <Input
                      id="login-email"
                      type="text"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="usuario@enlace.org"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(inputClass, "pr-11")}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:bg-[#e60b57]"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Entrar al sistema"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="max-h-[min(70vh,560px)] overflow-y-auto pr-1"
              >
                <div className="mb-7 hidden lg:block">
                  <h2 className="text-2xl font-semibold tracking-tight">Crear cuenta</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Solo si es tu primer acceso y tienes el código del administrador.
                  </p>
                </div>

                <form onSubmit={handleRegister} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reg-code"
                      className="flex items-center gap-1.5 text-sm font-medium text-brand"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Código de seguridad
                    </Label>
                    <Input
                      id="reg-code"
                      type="text"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      className={cn(
                        inputClass,
                        "border-brand/25 bg-brand/5 text-center font-mono tracking-widest"
                      )}
                      placeholder="XXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pídeselo a quien administra las cuentas.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-sm font-medium">
                      Nombre completo
                    </Label>
                    <Input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className={inputClass}
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-sm font-medium">
                      Correo corporativo
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={inputClass}
                      placeholder="usuario@enlace.org"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className={cn(inputClass, "pr-11")}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showRegPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showRegPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-sm font-medium">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Repetir contraseña"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={regLoading}
                    className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:bg-[#e60b57]"
                  >
                    {regLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </section>
    </div>
  );
}
