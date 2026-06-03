export const REPORT_PDF_COLORS = {
  primary: "#FF0C60",
  secondary: "#2D3748",
  textLight: "#718096",
  background: "#F7FAFC",
  border: "#E2E8F0",
  success: "#48BB78",
  warning: "#ECC94B",
} as const;

const PRIORITY_MAP: Record<string, string> = {
  Enlace: "Enlace",
  EJTV: "EJTV",
  "Enlace USA": "Enlace USA",
  EnlaceUSA: "Enlace USA",
  Todos: "Todos",
};

const CATEGORY_MAP: Record<string, string> = {
  transmision: "Transmisión",
  Transmisión: "Transmisión",
  audio: "Audio",
  Audio: "Audio",
  video: "Video",
  Video: "Video",
  equipos: "Equipos",
  Equipos: "Equipos",
  software: "Software",
  Software: "Software",
  infraestructura: "Infraestructura",
  "Falla Energética": "Falla Energética",
  otros: "Otros",
  Otros: "Otros",
};

const STATUS_MAP: Record<string, string> = {
  resolved: "Resuelto",
  pending: "Pendiente",
  "in-progress": "En Progreso",
};

export function formatPdfPriority(priority: string): string {
  const parts = priority.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.map((p) => PRIORITY_MAP[p] || p).join(", ");
}

export function formatPdfCategory(category: string): string {
  const parts = category.split(",").map((c) => c.trim()).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.map((c) => CATEGORY_MAP[c] || c).join(", ");
}

export function formatPdfStatus(status: string): string {
  return STATUS_MAP[status] || status;
}

export function formatPdfReportDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatPdfResolvedDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
