/**
 * Límites de texto para el PDF (A4, Geist 10pt, ancho ~170mm).
 * ~52 caracteres por línea × ~22 líneas en página 1 ≈ 1140 (soft).
 * Hasta 3 páginas de detalle ≈ 3200 caracteres (hard max).
 */
export const REPORT_DESCRIPTION_SOFT_MAX = 1200;

export const REPORT_DESCRIPTION_MAX_CHARS = 3200;

export const PDF_MAX_DESCRIPTION_PAGES = 3;

export function sanitizeReportDescription(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

export function clampReportDescription(
  text: string,
  max = REPORT_DESCRIPTION_MAX_CHARS
): string {
  const clean = sanitizeReportDescription(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export type DescriptionLengthTone = "ok" | "warn" | "error";

export function descriptionLengthState(length: number): {
  tone: DescriptionLengthTone;
  message: string;
} {
  const trimmed = length;
  if (trimmed > REPORT_DESCRIPTION_MAX_CHARS) {
    return {
      tone: "error",
      message: `Máximo ${REPORT_DESCRIPTION_MAX_CHARS} caracteres para el PDF (${trimmed}/${REPORT_DESCRIPTION_MAX_CHARS})`,
    };
  }
  if (trimmed > REPORT_DESCRIPTION_SOFT_MAX) {
    return {
      tone: "warn",
      message: `${trimmed} / ${REPORT_DESCRIPTION_MAX_CHARS} — el PDF usará más de una página`,
    };
  }
  return {
    tone: "ok",
    message: `${trimmed} / ${REPORT_DESCRIPTION_MAX_CHARS} caracteres`,
  };
}
