"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import LoginPage from "@/app/login/page";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login" && !pathname.startsWith("/operadores")) {
      router.replace("/login");
    }

    if (user?.role === 'ENGINEER' && (pathname.startsWith('/configuracion') || pathname.startsWith('/usuarios') || pathname.startsWith('/tareas'))) {
      router.replace("/");
    }

    if (user?.id) {
      fetch('/api/users/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).catch((err) => console.error(err));
    }
  }, [isLoading, user, pathname, router]);

  if (pathname.startsWith("/operadores")) {
    // Public route - page has its own header, no global navbar
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  if (!user && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-background">
        <LoginPage />
      </div>
    );
  }

  if (pathname === "/login" || pathname === "/crear-reporte") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen text-foreground relative flex flex-col">
      <div className="grid-background" />
      <Navbar />
      <main className="w-full flex-1 relative z-10">{children}</main>
    </div>
  );
}