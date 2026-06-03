import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { checkRateLimit } from "@/lib/api/rateLimitResponse";
import { loginSchema } from "@/lib/validation";
import { loginUser } from "@/server/services/authService";

const handleLogin = apiHandler({ bodySchema: loginSchema }, async ({ req, body }) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "Unknown";

  const { user, token } = await loginUser(body, ip);

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
  });

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  response.cookies.set("user-id", user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
});

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "AUTH");
  if (limited) return limited;

  return handleLogin(req, { params: Promise.resolve({}) });
}
