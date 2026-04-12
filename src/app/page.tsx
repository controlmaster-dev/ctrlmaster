import { DashboardClient } from "./DashboardClient";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Control - Inicio",
  description: "Plataforma de gestión de reportes para Enlace."
};

export default function Page() {
  return <DashboardClient />;
}