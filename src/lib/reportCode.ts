/** Códigos tipo D: prefijo de canal/tipo + correlativo (ej. ENL-0042, TX-0156). */

export const REPORT_CODE_PREFIXES = {
  ENL: "Enlace",
  EJT: "EJTV",
  EUS: "Enlace USA",
  TX: "Transmisión",
  AUD: "Audio",
  VID: "Video",
  EQP: "Equipos",
  SW: "Software",
  ENR: "Falla energética",
  GEN: "General",
} as const;

export type ReportCodePrefix = keyof typeof REPORT_CODE_PREFIXES;

const LEGACY_CODE = /^ENL[0-9]{4}[A-Z][0-9]{2}$/i;
const CHANNEL_CODE = /^[A-Z]{2,3}-\d{4,}$/i;

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Prefijo por canal (prioridad/sistema); si no hay, por primera categoría. */
export function resolveReportCodePrefix(
  category: string,
  priority: string
): ReportCodePrefix {
  const systemMap: Record<string, ReportCodePrefix> = {
    enlace: "ENL",
    ejtv: "EJT",
    "enlace usa": "EUS",
  };

  for (const raw of priority.split(",")) {
    const key = normalizeKey(raw);
    if (!key || key === "todos") continue;
    const prefix = systemMap[key];
    if (prefix) return prefix;
  }

  const categoryMap: Record<string, ReportCodePrefix> = {
    transmision: "TX",
    audio: "AUD",
    video: "VID",
    equipos: "EQP",
    software: "SW",
    "falla energetica": "ENR",
    otros: "GEN",
  };

  for (const raw of category.split(",")) {
    const key = normalizeKey(raw);
    if (!key) continue;
    const prefix = categoryMap[key];
    if (prefix) return prefix;
  }

  return "ENL";
}

export function formatReportCode(prefix: ReportCodePrefix, sequence: number): string {
  const safe = Math.max(1, Math.floor(sequence));
  return `${prefix}-${String(safe).padStart(4, "0")}`;
}

export function formatReportDisplayId(id: string, code?: string | null): string {
  const display = code?.trim();
  if (display) return display.toUpperCase();
  if (!id) return "—";
  if (CHANNEL_CODE.test(id) || LEGACY_CODE.test(id)) return id.toUpperCase();
  if (id.length > 12 && id.includes("-")) return id.slice(0, 8).toUpperCase();
  return id.toUpperCase();
}

export function parseReportCodeSequence(code: string, prefix: string): number | null {
  const match = code.trim().toUpperCase().match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function isChannelFormatReportCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  return CHANNEL_CODE.test(code.trim());
}

export function needsReportCodeMigration(code: string | null | undefined): boolean {
  return !isChannelFormatReportCode(code);
}

/** Máximo correlativo por prefijo a partir de códigos ya en formato ENL-0001. */
export function seedPrefixCountersFromCodes(
  codes: Array<string | null | undefined>
): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const raw of codes) {
    if (!isChannelFormatReportCode(raw)) continue;
    const match = raw!.trim().toUpperCase().match(/^([A-Z]{2,3})-(\d+)$/);
    if (!match) continue;
    const prefix = match[1];
    const seq = Number.parseInt(match[2], 10);
    if (Number.isFinite(seq)) {
      counters[prefix] = Math.max(counters[prefix] ?? 0, seq);
    }
  }
  return counters;
}
