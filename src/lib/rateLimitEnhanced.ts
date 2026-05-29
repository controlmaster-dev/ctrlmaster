


import { RATE_LIMIT_CONFIG } from '@/config/constants';
import sql from '@/lib/db';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}


const rateLimitStore: RateLimitStore = {};


function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}


function checkRateLimitInMemory(
  identifier: string,
  maxRequests: number = RATE_LIMIT_CONFIG.MAX_REQUESTS.GENERAL,
  windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
): { success: boolean; limit: number; remaining: number; reset: Date } {

  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore[identifier];


  if (!entry || entry.resetTime < now) {
    rateLimitStore[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: new Date(now + windowMs),
    };
  }


  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(entry.resetTime),
    };
  }


  entry.count++;

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: new Date(entry.resetTime),
  };
}


export async function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_CONFIG.MAX_REQUESTS.GENERAL,
  windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const resetAt = new Date(Date.now() + windowMs);

  try {
    if (Math.random() < 0.01) {
      await sql`DELETE FROM "RateLimit" WHERE "resetAt" < NOW()`;
    }

    const [entry] = await sql`
      INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
      VALUES (${identifier}, 1, ${resetAt.toISOString()}, NOW())
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimit"."resetAt" < NOW() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" < NOW() THEN ${resetAt.toISOString()}
          ELSE "RateLimit"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `;

    const count = Number(entry.count);
    const reset = new Date(entry.resetAt);

    return {
      success: count <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(maxRequests - count, 0),
      reset,
    };
  } catch (error) {
    console.warn('[rate-limit] Falling back to in-memory store:', error);
    return checkRateLimitInMemory(identifier, maxRequests, windowMs);
  }
}


export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}


export function createRateLimiter(type: keyof typeof RATE_LIMIT_CONFIG.MAX_REQUESTS = 'GENERAL') {
  const maxRequests = RATE_LIMIT_CONFIG.MAX_REQUESTS[type];
  const windowMs = RATE_LIMIT_CONFIG.WINDOW_MS;

  return (identifier: string) => {
    return checkRateLimit(identifier, maxRequests, windowMs);
  };
}


export function withRateLimit(type: keyof typeof RATE_LIMIT_CONFIG.MAX_REQUESTS = 'GENERAL') {
  const limiter = createRateLimiter(type);

  return async (request: Request) => {
    const ip = getClientIp(request);
    const result = await limiter(`${type}:${ip}`);

    if (!result.success) {
      return {
        isRateLimited: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }

    return {
      isRateLimited: false,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  };
}
