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


  // Allow /operadores to render without user, and WITHOUT wrapping (avoids double navbar)
  if (pathname.startsWith("/operadores")) {
    return <>{children}</>
  }


  // Prevent flash of login page while checking authentication
  if (isLoading) {
    return null // or a loading spinner
  }

  if (!user && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-background">
        <LoginPage />
      </div>
    )
  }

  if (pathname === "/login") {
    return <>{children}</>
  }

  // Hide Navbar for Create Report page (Wizard Mode)
  if (pathname === "/crear-reporte") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen text-foreground relative flex flex-col">
      <div className="grid-background" />
      <Navbar />
      <main className="w-full flex-1 relative z-10">{children}</main>
    </div>
  )
}
