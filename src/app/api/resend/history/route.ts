import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

const HISTORY_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

export const GET = apiHandler({ auth: true, roles: HISTORY_ROLES }, async () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("No RESEND_API_KEY found in environment");
    return { data: [] };
  }

  const res = await fetch("https://api.resend.com/emails", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn("Resend API Error (History):", res.status, text);
    return { data: [] };
  }

  const data = await res.json();
  return NextResponse.json(data);
});
