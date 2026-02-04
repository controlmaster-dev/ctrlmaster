"use client"

import { useAuth } from "@/contexts/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import LoginPage from "@/app/login/page"
import BackgroundShapes from "@/app/login/BackgroundShapes"

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
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden">
        {/* Usamos el mismo background que el login para consistencia */}
        <BackgroundShapes />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#FF0C60]/20 blur-2xl rounded-full animate-pulse"></div>
            <img
              src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png"
              alt="Logo"
              className="w-24 h-24 object-contain relative z-10"
            />
          </div>

          {/* Spinner sutil y elegante */}
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#FF0C60] rounded-full animate-spin" />
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
