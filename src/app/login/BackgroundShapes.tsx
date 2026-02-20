"use client"



export default function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
            {/* Subtle Center Glow to highlight the card - adapt to current theme */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,12,96,0.03)_0%,transparent_70%)] opacity-50 dark:opacity-100 transition-opacity duration-500" />

            {/* CROSS-FADING VIGNETTES for smooth theme switching */}
            {/* Light Mode Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.03)_100%)] dark:opacity-0 transition-opacity duration-500" />

            {/* Dark Mode Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] opacity-0 dark:opacity-100 transition-opacity duration-500" />
        </div>
    )
}
