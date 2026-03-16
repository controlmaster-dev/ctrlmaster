"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import LoginPage from "@/app/login/page";import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function AuthWrapper({ children }) {
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
        body: JSON.stringify({ userId: user.id })
      }).catch((err) => console.error(err));
    }
  }, [isLoading, user, pathname, router]);



  if (pathname.startsWith("/operadores")) {
    return _jsx(_Fragment, { children: children });
  }



  if (isLoading) {
    return null;
  }

  if (!user && pathname !== "/login") {
    return (
      _jsx("div", { className: "min-h-screen bg-background", children:
        _jsx(LoginPage, {}) }
      ));

  }

  if (pathname === "/login") {
    return _jsx(_Fragment, { children: children });
  }


  if (pathname === "/crear-reporte") {
    return _jsx(_Fragment, { children: children });
  }

  return (
    _jsxs("div", { className: "min-h-screen text-foreground relative flex flex-col", children: [
      _jsx("div", { className: "grid-background" }),
      _jsx(Navbar, {}),
      _jsx("main", { className: "w-full flex-1 relative z-10", children: children })] }
    ));

}