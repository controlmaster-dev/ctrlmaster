"use client"

import { motion } from "framer-motion"

export default function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050505]">
            {/* SaaS Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            {/* Primary Brand Glow - Top Right */}
            <motion.div
                className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[radial-gradient(circle_farthest-side,rgba(255,12,96,0.15),rgba(255,255,255,0))]"
                animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Secondary Cool Glow - Bottom Left */}
            <motion.div
                className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.1),rgba(255,255,255,0))]"
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Accent Orbs */}
            <motion.div
                className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-[#FF0C60] shadow-[0_0_20px_4px_rgba(255,12,96,0.6)]"
                animate={{
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            <motion.div
                className="absolute bottom-[30%] right-[20%] w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.6)]"
                animate={{
                    y: [0, -15, 0],
                    opacity: [0, 0.8, 0],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Starry Noise */}
            <div className="absolute inset-0 opacity-[0.2] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        </div>
    )
}
