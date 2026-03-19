import { YoutubeDownloader } from "@/components/youtube/YoutubeDownloader";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Control - Descargar Música",
  description: "Descarga audio de YouTube directamente desde Control Máster."
};

export default function YoutubePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-rose-500/30">
      {/* Simple Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/40 font-medium">/</span>
            <span className="font-bold tracking-tight">YouTube Downloader</span>
          </div>
        </div>
        
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 border-border bg-card hover:bg-muted hidden md:flex">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-12">
        <YoutubeDownloader />
      </main>
    </div>
  );
}
