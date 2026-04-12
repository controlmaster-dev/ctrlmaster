import { MonitoreoClient } from "./MonitoreoClient";

export const metadata = {
  title: "Control - Monitoreo",
  description: "Monitoreo en tiempo real de las señales de Enlace.",
};

export default function Page() {
  return <MonitoreoClient />;
}