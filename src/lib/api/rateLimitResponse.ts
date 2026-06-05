import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_CONFIG } from "@/config/constants";
import { withRateLimit } from "@/lib/rateLimitEnhanced";

type RateLimitPreset = keyof typeof RATE_LIMIT_CONFIG.MAX_REQUESTS;

export async function checkRateLimit(
  req: NextRequest,
  preset: RateLimitPreset,
  errorMessage = "Demasiados intentos. Por favor espera unos minutos."
): Promise<NextResponse | null> {
  const result = await withRateLimit(preset)(req);
  if (!result.isRateLimited) return null;

  return NextResponse.json(
    {
      error: errorMessage,
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toISOString(),
      },
    }
  );
}
