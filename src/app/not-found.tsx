"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    const router = useRouter()

    return (
        <div
            id="not-found-container"
            className="fixed inset-0 z-[99999] bg-white text-black flex items-center justify-center overflow-hidden"
            style={{ isolation: 'isolate' }}
        >
            {/* Dot Grid Background */}
            <div
                className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #000000 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Content */}
            <div className="relative z-[100001] text-center px-6 max-w-2xl mx-auto">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black leading-tight">
                            Página no encontrada.
                        </h1>
                        <p className="text-zinc-500 text-base md:text-lg font-normal max-w-md mx-auto leading-relaxed">
                            La página que solicitaste no está disponible o no existe en el sistema.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={() => router.back()}
                            className="w-full sm:w-auto min-w-[140px] bg-black text-white hover:bg-zinc-800 border-none rounded-full flex items-center justify-center gap-2 h-12 px-8 transition-all hover:scale-105 active:scale-95 font-semibold shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Atrás</span>
                        </Button>

                        <Link href="/" passHref className="w-full sm:w-auto">
                            <Button
                                className="w-full sm:w-auto min-w-[140px] bg-zinc-100 text-black hover:bg-zinc-200 border border-zinc-200 rounded-full flex items-center justify-center gap-2 h-12 px-8 transition-all hover:scale-105 active:scale-95 font-semibold"
                            >
                                <Home className="w-5 h-5" />
                                <span>Inicio</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-100 blur-[150px] rounded-full pointer-events-none -z-10" />
        </div>
    )
}
