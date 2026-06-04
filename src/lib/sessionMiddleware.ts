import type { NextRequest } from "next/server";

/** Comprueba que existan cookies de sesión (sin ir a la BD). */
export function hasAuthCookies(request: NextRequest): boolean {
  const token = request.cookies.get("auth-token")?.value;
  const userId = request.cookies.get("user-id")?.value;
  return Boolean(token && userId);
}

export async function isSessionValid(request: NextRequest): Promise<boolean> {
  return hasAuthCookies(request);
}
