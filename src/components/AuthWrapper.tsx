"use client"

import { useAuth } from "@/contexts/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import LoginPage from "@/app/login/page"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()


  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login" && !pathname.startsWith("/operadores")) {
      router.replace("/login")
    }

    if (user?.role === 'ENGINEER' && (pathname.startsWith('/configuracion') || pathname.startsWith('/usuarios') || pathname.startsWith('/tareas'))) {
      router.replace("/")
    }

    // Heartbeat
    if (user?.id) {
      fetch('/api/users/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      }).catch(err => console.error(err))
    }
  }, [isLoading, user, pathname, router])

  if (isLoading) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background"
      >
        {/* Bolas flotantes */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF0C60]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/4 right-20 w-80 h-80 bg-[#90cccf]/10 rounded-full blur-3xl animate-float delay-500"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-[#FF0C60]/10 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#90cccf]/10 rounded-full blur-3xl animate-float delay-1500"></div>

        {/* Logo y loader */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <img
            src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
            alt="Enlace Canal 23"
            className="w-24 h-24 object-contain drop-shadow-lg animate-bounce"
          />
          <div className="w-12 h-12 border-4 border-white/20 border-t-[#FF0C60] rounded-full animate-spin"></div>
          <p className="text-white text-lg font-medium animate-pulse">Cargando...</p>
        </div>
      </div>
    )
  }

  // Allow /operadores to render without user, and WITHOUT wrapping (avoids double navbar)
  if (pathname.startsWith("/operadores")) {
    return <>{children}</>
  }


  if (!user && pathname !== "/login") return <LoginPage />

  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen text-foreground relative">
      <Navbar />
      <main className="w-full pt-20 md:pt-0">{children}</main>
    </div>
  )
}
