import { CrearReporteClient } from "./CrearReporteClient";

export const metadata = {
  title: "Control - Nuevo Reporte",
  description: "Crear un nuevo reporte de incidencia en el sistema Control Máster.",
};

export default function Page() {
  return <CrearReporteClient />;
}