
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ThemeProvider } from "@/components/theme-provider"
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";
import { Toaster } from "@/components/ui/sonner"
import { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "Enlace",
    template: "%s | Enlace",
  },
  description: "Plataforma de gestión de reportes para Enlace.",
  icons: {
    icon: "/lgoiso.png",
    apple: "/lgoiso.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Enlace",
  },
}

// Removed Geist imports and variable declarations

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthWrapper>
              {children}
              <MobileInstallPrompt />
              <Toaster />
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}