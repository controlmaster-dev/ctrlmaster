"use client"

import { motion } from "framer-motion"

export default function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Deep Dark Gradient Background */}
            <div className="absolute inset-0 bg-[#000000]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#000000] opacity-80" />

            {/* Floating 3D-like Shapes - Monochrome/Dark */}

            {/* Shape 1: Top Left - White/Gray glow */}
            <motion.div
                className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 20, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Shape 2: Bottom Right - Dark gray subtle wave */}
            <motion.div
                className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-gray-500/10 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                    x: [0, -40, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Abstract SVGs imitating the reference 3D shapes but Dark/Metallic */}

            {/* Spiral/Spring Shape */}
            <motion.div
                className="absolute top-1/4 right-[10%]"
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
                    <path d="M50 150 C 20 150, 20 50, 100 50 S 180 50, 150 150" stroke="url(#gray-gradient)" strokeWidth="20" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="gray-gradient" x1="0" y1="0" x2="200" y2="200">
                            <stop offset="0%" stopColor="#404040" />
                            <stop offset="100%" stopColor="#1a1a1a" />
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>

            {/* Squiggle Shape */}
            <motion.div
                className="absolute bottom-1/4 left-[10%]"
                animate={{
                    rotate: [0, 10, 0],
                    x: [0, 15, 0]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
                    <path d="M20 130 C 50 130, 50 80, 80 80 S 110 30, 140 30" stroke="url(#silver-gradient)" strokeWidth="18" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="silver-gradient" x1="0" y1="0" x2="200" y2="200">
                            <stop offset="0%" stopColor="#808080" />
                            <stop offset="100%" stopColor="#303030" />
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>

        </div>
    )
}
