import type { NextRequest } from "next/server";

/** Comprueba que existan cookies de sesión (sin ir a la BD). */
export function hasAuthCookies(request: NextRequest): boolean {
  const token = request.cookies.get("auth-token")?.value;
  const userId = request.cookies.get("user-id")?.value;
  return Boolean(token && userId);
}

/**
 * El middleware no debe llamar a /api/auth/verify en cada navegación:
 * un timeout de Neon se interpretaba como "sesión inválida" y mandaba al login.
 * La validación real ocurre en cada ruta API con validateApiAuth.
 */
export async function isSessionValid(request: NextRequest): Promise<boolean> {
  return hasAuthCookies(request);
}
