import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ThemeProvider } from "@/components/theme-provider"
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://enlacemaster.live"),
  title: {
    default: "Control Master",
    template: "%s | Control Master",
  },
  description: "Sistema gestión y monitoreo para Enlace Canal 23.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Control Master",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://enlacemaster.live",
    title: "Control Master",
    description: "Sistema gestión y monitoreo para Enlace Canal 23.",
    siteName: "Control Master",
  },
  twitter: {
    card: "summary_large_image",
    title: "Control Master",
    description: "Sistema gestión y monitoreo para Enlace Canal 23.",
  },
  icons: {
    icon: [
      {
        url: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  },
};

export const viewport = {
  themeColor: "#FF0C60",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthWrapper>
              {children}
              <MobileInstallPrompt />
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}