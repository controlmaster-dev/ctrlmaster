import { ReportesClient } from "./ReportesClient";

export const metadata = {
  title: "Control - Reportes",
  description: "Lista de incidencias y reportes técnicos de Control Máster.",
};

export default function Page() {
  return <ReportesClient />;
}