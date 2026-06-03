import { CheckCircle, Eye, ThumbsUp, type LucideIcon } from "lucide-react";

export const REPORT_REACTIONS = [
  { id: "useful", label: "Útil", Icon: ThumbsUp },
  { id: "seen", label: "Visto", Icon: Eye },
  { id: "ack", label: "Confirmado", Icon: CheckCircle },
] as const;

export type ReportReactionId = (typeof REPORT_REACTIONS)[number]["id"];

const LEGACY_EMOJI_TO_ID: Record<string, ReportReactionId> = {
  "👍": "useful",
  "👀": "seen",
  "✅": "ack",
};

export function normalizeReactionId(stored: string): string {
  return LEGACY_EMOJI_TO_ID[stored] ?? stored;
}

export function getReportReaction(
  stored: string
): (typeof REPORT_REACTIONS)[number] | null {
  const id = normalizeReactionId(stored);
  return REPORT_REACTIONS.find((r) => r.id === id) ?? null;
}

export function getReportReactionLabel(stored: string): string {
  return getReportReaction(stored)?.label ?? stored;
}

export const COMMENT_LIKE_REACTION_ID: ReportReactionId = "useful";
