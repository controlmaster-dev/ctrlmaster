import type { NextRequest } from "next/server";
import { hasAuthCookies as hasAuthCookiesEdge } from "@/lib/authCookies";
import { validateSessionToken } from "@/lib/auth";
import { isTransientDbError } from "@/lib/dbErrors";

const CACHE_TTL_MS = 45_000;
const MAX_CACHE_ENTRIES = 500;

type CacheEntry = {
  valid: boolean;
  expiresAt: number;
};

const sessionCache = new Map<string, CacheEntry>();

function readCache(token: string): boolean | null {
  const entry = sessionCache.get(token);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    sessionCache.delete(token);
    return null;
  }

  return entry.valid;
}

function writeCache(token: string, valid: boolean): void {
  if (sessionCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = sessionCache.keys().next().value;
    if (oldestKey) sessionCache.delete(oldestKey);
  }

  sessionCache.set(token, {
    valid,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Limpia la caché de sesión (útil en tests). */
export function clearSessionCache(): void {
  sessionCache.clear();
}

/** Re-export para tests y código server; implementación edge-safe en authCookies. */
export const hasAuthCookies = hasAuthCookiesEdge;

export type SessionValidationResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

export async function validateSession(
  request: NextRequest
): Promise<SessionValidationResult> {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return { ok: false, reason: "missing" };
  }

  const cached = readCache(token);
  if (cached !== null) {
    return cached ? { ok: true } : { ok: false, reason: "invalid" };
  }

  try {
    const valid = await validateSessionToken(token);
    writeCache(token, valid);
    return valid ? { ok: true } : { ok: false, reason: "invalid" };
  } catch (error) {
    if (isTransientDbError(error)) {
      return { ok: false, reason: "unavailable" };
    }
    throw error;
  }
}

export async function isSessionValid(request: NextRequest): Promise<boolean> {
  const result = await validateSession(request);
  return result.ok;
}
