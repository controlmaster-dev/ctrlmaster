"use client"

import { ComposableMap, Geographies, Geography } from "react-simple-maps"


const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface LoginMapProps {
    users: {
        id: string
        name: string
        lastLoginCountry?: string
        lastLoginIP?: string
    }[]
}

// Simple coordinate mapping for demo purposes. 
// In a real app, you'd want lat/long stored in DB.
// Since we only have "Country Name", we'll approximate a few for display
// or ideally, we'd fetch lat/long from the IP API as well.
// For this iteration, I'll update the backend to save lat/long IF I can, 
// OR I'll just map a few known ones and fallback to 0,0.
// ACTUALLY: The IP API returns lat/lon. It's better to use that.
// BUT, I can't change the schema again easily without migration risk/time.
// SO, I will use a simple client-side lookup for a few major countries or 
// just render a generic "Map View" that highlights countries.

// Let's highlight countries instead of markers for now, simpler and arguably "cooler".
// OR, I can try to fetch lat/long on the client for the map? No, too many requests.

// RE-READING: User wants "un resumen de los puntos de dónde accesan".
// I'll stick to a simple lookup for "Costa Rica", "USA", and "Desconocido".
// And for others, I'll assume 0,0 for now or add a small lookup list.
// The `ip-api` actually returns lat/lon. 
// Use: http://ip-api.com/line/8.8.8.8 gives lat/lon.
// I will update the map logic to just highlight the countries for now as a heatmap style.
// It's safer than guessing coords.

export function LoginMap({ users }: LoginMapProps) {
    // Count logins per country
    const countryCounts: Record<string, number> = {}
    users.forEach(u => {
        const c = u.lastLoginCountry || "Unknown"
        if (c !== "Unknown" && c !== "Localhost" && c !== "Local Loopback") {
            countryCounts[c] = (countryCounts[c] || 0) + 1
        }
    })

    const maxLogins = Math.max(...Object.values(countryCounts), 0)

    // Scale for coloring - simplified for semantic usage
    // We will just use conditional logic in render since d3-scale returns hex usually

    return (
        <div className="w-full h-[320px] bg-muted/30 rounded-md overflow-hidden relative shadow-sm border border-border group">
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-tight text-muted-foreground border border-border flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Mapa de Actividad Global
            </div>
            {maxLogins === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md px-6 py-4 rounded-md border border-border text-center shadow-lg">
                        <p className="text-xs text-foreground font-semibold tracking-tight">Sin datos de geolocalización</p>
                        <p className="text-[10px] text-muted-foreground mt-1 tracking-tight font-medium">Sincronización pendiente</p>
                    </div>
                </div>
            )}
            <ComposableMap projectionConfig={{ scale: 190, center: [0, 20] }} height={300}>
                <Geographies geography={geoUrl}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {({ geographies }: { geographies: any[] }) =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        geographies.map((geo: any) => {
                            const countryName = geo.properties.name
                            const count = countryCounts[countryName] || 0

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={count > 0 ? "#FF0C60" : "currentColor"}
                                    stroke="hsl(var(--border))"
                                    className="text-muted-foreground/20 hover:text-muted-foreground transition-colors duration-300"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: count > 0 ? "#FF0C60" : "currentColor", outline: "none", cursor: "pointer" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            )
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    )
}
