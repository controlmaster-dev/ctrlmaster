
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";
import { Toaster } from "@/components/ui/sonner";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";


export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata = {
  title: {
    default: "Enlace",
    template: "%s | Enlace"
  },
  description: "Plataforma de gestión de reportes para Enlace.",
  icons: {
    icon: "/lgoiso.png",
    apple: "/lgoiso.png"
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Enlace"
  }
};



export default function RootLayout({
  children


}) {
  return (
    _jsx("html", { lang: "es", suppressHydrationWarning: true, children:
      _jsx("body", { className: "antialiased", children:
        _jsx(ThemeProvider, {
          attribute: "class",
          defaultTheme: "system",
          enableSystem: true,
          disableTransitionOnChange: true, children:

          _jsx(AuthProvider, { children:
            _jsxs(AuthWrapper, { children: [
              children,
              _jsx(MobileInstallPrompt, {}),
              _jsx(Toaster, {})] }
            ) }
          ) }
        ) }
      ) }
    ));

}