import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/operadores',
  '/operadores/monitoreo',
];

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/logout',
  '/api/users/public',
  '/api/operadores/bootstrap',
  '/api/special-events',
  '/api/calendar',
  '/api/health',
];

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

function pathMatches(path: string, patterns: readonly string[]): boolean {
  for (const pattern of patterns) {
    if (path === pattern || path.startsWith(`${pattern}/`)) {
      return true;
    }
  }
  return false;
}

function hasAuthCookie(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value;
  return typeof token === 'string' && token.length > 0;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  return response;
}

/**
 * Edge-only: sin imports @/ ni Mongoose.
 * La validación de token en BD ocurre en las rutas API (apiHandler).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/icons') ||
    /\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|pdf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isPublic =
    pathMatches(pathname, PUBLIC_ROUTES) ||
    pathMatches(pathname, PUBLIC_API_ROUTES) ||
    (pathname.startsWith('/api/cron/') &&
      process.env.CRON_SECRET &&
      request.headers.get('authorization') ===
        `Bearer ${process.env.CRON_SECRET}`);

  if (!isPublic && !hasAuthCookie(request)) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'No autorizado. Inicia sesión nuevamente.' },
          { status: 401 }
        )
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|uploads|fonts|icons).*)',
  ],
};
