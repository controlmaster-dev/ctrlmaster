"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
export function LoginMap({ users }) {
  const countryCounts: Record<string, number> = {};
  users.forEach((u) => {
    const c = u.lastLoginCountry || "Unknown";
    if (c !== "Unknown" && c !== "Localhost" && c !== "Local Loopback") {
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
  });

  const maxLogins = Math.max(...Object.values(countryCounts), 0);

  return (
    _jsxs("div", {
      className: "w-full h-[320px] bg-muted/30 rounded-md overflow-hidden relative shadow-sm border border-border group", children: [
        _jsxs("div", {
          className: "absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-tight text-muted-foreground border border-border flex items-center gap-2", children: [
            _jsx("div", { className: "w-1.5 h-1.5 bg-blue-500 rounded-full" }), "Mapa de Actividad Global"]
        }

        ),
        maxLogins === 0 &&
        _jsx("div", {
          className: "absolute inset-0 flex items-center justify-center z-20 pointer-events-none", children:
            _jsxs("div", {
              className: "bg-background/90 backdrop-blur-md px-6 py-4 rounded-md border border-border text-center shadow-lg", children: [
                _jsx("p", { className: "text-xs text-foreground font-semibold tracking-tight", children: "Sin datos de geolocalizaci\xF3n" }),
                _jsx("p", { className: "text-[10px] text-muted-foreground mt-1 tracking-tight font-medium", children: "Sincronizaci\xF3n pendiente" })]
            }
            )
        }
        ),
        _jsx(ComposableMap, {
          projectionConfig: { scale: 190, center: [0, 20] }, height: 300, children:
            _jsx(Geographies, {
              geography: geoUrl, children:

                ({ geographies }) =>
                  geographies.map((geo: { properties: { name: string }, rsmKey: string }) => {
                    const countryName = geo.properties.name;
                    const count = countryCounts[countryName] || 0;

                    return (
                      _jsx(Geography, {

                        geography: geo,
                        fill: count > 0 ? "#FF0C60" : "currentColor",
                        stroke: "hsl(var(--border))",
                        className: "text-muted-foreground/20 hover:text-muted-foreground transition-colors duration-300",
                        strokeWidth: 0.5,
                        style: {
                          default: { outline: "none" },
                          hover: { fill: count > 0 ? "#FF0C60" : "currentColor", outline: "none", cursor: "pointer" },
                          pressed: { outline: "none" }
                        }
                      }, geo.rsmKey
                      ));

                  })
            }

            )
        }
        )]
    }
    ));

}