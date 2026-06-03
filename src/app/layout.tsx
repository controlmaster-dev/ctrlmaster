import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PautaReminderProvider } from "@/contexts/PautaReminderContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";
import { Toaster } from "@/components/ui/sonner";
import { type Viewport, type Metadata } from "next";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://enlacecr.dev"),
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="cm-theme"
          disableTransitionOnChange
        >
          <AuthProvider>
            <PautaReminderProvider>
              <AuthWrapper>
                {children}
                <MobileInstallPrompt />
                <Toaster />
              </AuthWrapper>
            </PautaReminderProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
