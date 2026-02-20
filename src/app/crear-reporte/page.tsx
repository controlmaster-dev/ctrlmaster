import { CrearReporteClient } from "./CrearReporteClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Control - Nuevo Reporte",
    description: "Crear un nuevo reporte de incidencia en el sistema Control Máster.",
}

export default function Page() {
    return <CrearReporteClient />
}
