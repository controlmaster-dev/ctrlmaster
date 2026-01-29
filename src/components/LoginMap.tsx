"use client"

import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleLinear } from "d3-scale"

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

    // Scale for coloring
    const colorScale = scaleLinear()
        .domain([0, maxLogins])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .range(["#27272a", "#FF0C60"] as any) // Dark grey to Brand Pink

    return (
        <div className="w-full h-[300px] bg-[#18181b] rounded-xl overflow-hidden border border-white/5 relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white border border-white/10">
                Mapa de Actividad (Global)
            </div>
            {maxLogins === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 text-center">
                        <p className="text-sm text-slate-300 font-medium">Sin datos de ubicación</p>
                        <p className="text-xs text-slate-500 mt-1">Los usuarios deben volver a iniciar sesión.</p>
                    </div>
                </div>
            )}
            <ComposableMap projectionConfig={{ scale: 180, center: [0, 20] }} height={300}>
                <Geographies geography={geoUrl}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {({ geographies }: { geographies: any[] }) =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        geographies.map((geo: any) => {
                            const countryName = geo.properties.name
                            // Simple name matching (roughly)
                            // ip-api returns English names mostly.
                            // GeoJSON uses English names.
                            const count = countryCounts[countryName] || 0

                            // Special case for Costa Rica if names mismatch slightly?
                            // Usually "Costa Rica" is standard.

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={count > 0 ? colorScale(count) : "#27272a"}
                                    stroke="#3f3f46"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: count > 0 ? "#FF0C60" : "#3f3f46", outline: "none" },
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
