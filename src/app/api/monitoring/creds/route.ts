import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const user = process.env.MONITOR_USER;
  const pass = process.env.MONITOR_PASS;

  if (!user || !pass) {
    return NextResponse.json(
      { error: "Monitoring credentials not configured on server" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user,
    pass,
    iframeUrl: process.env.MONITOR_IFRAME_URL || "https://componentes.enlace.org/live/multiview/"
  });
}
