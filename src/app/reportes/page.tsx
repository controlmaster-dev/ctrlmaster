import { ReportesClient } from "./ReportesClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Control - Reportes",
  description: "Lista de incidencias y reportes técnicos de Control Máster.",
}

export default function Page() {
  return <ReportesClient />
}
