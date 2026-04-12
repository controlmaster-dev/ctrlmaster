/**
 * Next.js Middleware for authentication and security headers
 * Runs on every request before the page/API route is rendered
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

// API routes that are public (no auth required)
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/registration-codes',
  '/api/auth/verify',
];

/**
 * Security headers to add to every response
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  // Enable XSS protection
  'X-Content-Type-Options': 'nosniff',
  // Prevent MIME type sniffing
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  // HTTP Strict Transport Security (production only)
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

/**
 * Check if a path matches any of the given patterns
 */
function pathMatches(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (path === pattern) return true;
    if (path.startsWith(pattern + '/')) return true;
    return false;
  });
}

/**
 * Check if the request is for a public API route
 */
function isPublicApiRoute(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_API_ROUTES);
}

/**
 * Check if the request is for a public page route
 */
function isPublicRoute(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_ROUTES);
}

/**
 * Check if the request is for an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Quick session check by verifying cookie presence
 * Full validation happens in API routes themselves
 */
function hasSessionCookie(request: NextRequest): boolean {
  return !!request.cookies.get('auth-token')?.value;
}

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublic = isPublicRoute(pathname) || isPublicApiRoute(pathname);

  // For API routes, check cookie presence
  if (isApiRoute(pathname) && !isPublic) {
    const hasSession = hasSessionCookie(request);

    if (!hasSession) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión nuevamente.' },
        {
          status: 401,
          headers: SECURITY_HEADERS,
        }
      );
    }
  }

  // For page routes, redirect to login if no session cookie
  if (!isPublic && !isApiRoute(pathname)) {
    const hasSession = hasSessionCookie(request);

    if (!hasSession) {
      const loginUrl = new URL('/login', request.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers to response
  const response = NextResponse.next();

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Configure which routes should use this middleware
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|manifest|uploads).*)',
  ],
};
