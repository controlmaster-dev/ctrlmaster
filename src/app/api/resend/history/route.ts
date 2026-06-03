import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { isEmailNetworkError } from "@/lib/emailDelivery";

export const dynamic = "force-dynamic";

const HISTORY_ROLES = ["ADMIN", "BOSS", "ENGINEER"];
const FETCH_TIMEOUT_MS = 12_000;

function emptyHistory() {
  return NextResponse.json(
    { data: [] },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}

async function fetchResendHistory(apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("Resend API Error (History):", res.status, text);
      return null;
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = apiHandler({ auth: true, roles: HISTORY_ROLES }, async () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return emptyHistory();
  }

  try {
    const data = await fetchResendHistory(apiKey);
    if (!data) return emptyHistory();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const hint = isEmailNetworkError(message) || message.includes("aborted")
      ? "red/DNS"
      : message;
    console.warn("[resend/history] No disponible:", hint);
    return emptyHistory();
  }
});
