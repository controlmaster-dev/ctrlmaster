"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppDataPrefetch } from "@/components/AppDataPrefetch";
import LoginPage from "@/app/login/page";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login" && !pathname.startsWith("/operadores")) {
      router.replace("/login");
    }

    if (user?.role === 'ENGINEER' && (pathname.startsWith('/configuracion') || pathname.startsWith('/usuarios'))) {
      router.replace("/");
    }

    if (user?.id) {
      fetch('/api/users/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    }
  }, [isLoading, user, pathname, router]);

  if (pathname.startsWith("/operadores")) {

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
      <AppDataPrefetch />
      <Navbar />
      <main className="relative z-10 w-full flex-1">{children}</main>
    </div>
  );
}
