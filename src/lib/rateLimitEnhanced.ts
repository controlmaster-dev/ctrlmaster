/**
 * Enhanced rate limiting utilities
 */

import { RATE_LIMIT_CONFIG } from '@/config/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory store for rate limiting
// In production, use Redis or a database
const rateLimitStore: RateLimitStore = {};

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit info
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_CONFIG.MAX_REQUESTS.GENERAL,
  windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
): { success: boolean; limit: number; remaining: number; reset: Date } {
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore[identifier];

  // If no entry exists or entry has expired, create a new one
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

  // Check if limit has been exceeded
  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(entry.resetTime),
    };
  }

  // Increment count
  entry.count++;

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: new Date(entry.resetTime),
  };
}

/**
 * Get client IP address from request
 * 
 * @param request - Next.js request object
 * @returns Client IP address
 */
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

/**
 * Create a rate limiter for a specific endpoint type
 * 
 * @param type - Type of endpoint (auth, reports, upload, general)
 * @returns Rate limit check function
 */
export function createRateLimiter(type: keyof typeof RATE_LIMIT_CONFIG.MAX_REQUESTS = 'GENERAL') {
  const maxRequests = RATE_LIMIT_CONFIG.MAX_REQUESTS[type];
  const windowMs = RATE_LIMIT_CONFIG.WINDOW_MS;
  
  return (identifier: string) => {
    return checkRateLimit(identifier, maxRequests, windowMs);
  };
}

/**
 * Rate limit middleware for API routes
 * 
 * @param type - Type of endpoint
 * @returns Middleware function
 */
export function withRateLimit(type: keyof typeof RATE_LIMIT_CONFIG.MAX_REQUESTS = 'GENERAL') {
  const limiter = createRateLimiter(type);
  
  return async (request: Request) => {
    const ip = getClientIp(request);
    const result = limiter(ip);
    
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
