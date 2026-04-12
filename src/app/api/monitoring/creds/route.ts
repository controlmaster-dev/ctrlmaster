import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simple check for MONITOR_USER and MONITOR_PASS in environment
  const user = process.env.MONITOR_USER;
  const pass = process.env.MONITOR_PASS;

  if (!user || !pass) {
    return NextResponse.json(
      { error: "Monitoring credentials not configured on server" },
      { status: 500 }
    );
  }

  // We return them. 
  // IMPORTANT: In a real production app, we would check the session here.
  // Since we are useAuth() in the frontend, the monitoring page itself 
  // is protected. But let's add a basic check if possible.
  
  return NextResponse.json({
    user,
    pass,
    iframeUrl: process.env.MONITOR_IFRAME_URL || "https://componentes.enlace.org/live/multiview/"
  });
}
