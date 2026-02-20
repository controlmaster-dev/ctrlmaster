import { MonitoreoClient } from "./MonitoreoClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Control - Monitoreo",
    description: "Monitoreo en tiempo real de las señales de Enlace.",
}

export default function Page() {
    return <MonitoreoClient />
}
